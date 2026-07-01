import * as crypto from 'node:crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { Model, Types } from 'mongoose';
import { MailService } from '../../core/mail/mail.service';
import { AppLoggerService } from '../../core/logger/logger.service';
import { UserActivityDocument, UserDocument, UserPreferenceDocument } from '../../database/schemas';
import { EmailBody, LoginBody, ResetPasswordBody, SignupBody, VerifyEmailBody } from './auth.schemas';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '1d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const STREAK_TIME_ZONE = 'Africa/Cairo';
const generateVerificationToken = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

type UserDoc = UserDocument & Record<string, any>;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('UserPreference')
    private readonly userPreferenceModel: Model<UserPreferenceDocument>,
    @InjectModel('UserActivity')
    private readonly userActivityModel: Model<UserActivityDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly logger: AppLoggerService,
  ) {}

  async signup(body: SignupBody, res: Response) {
    const existing = await this.userModel.findOne({
      $or: [{ email: body.email }, { username: body.username }],
    });

    if (existing) {
      const field = existing.get('email') === body.email ? 'email' : 'username';
      throw new HttpException(
        {
          success: false,
          message: 'Validation failed.',
          errors: [
            {
              field,
              message:
                field === 'email'
                  ? 'Email is already registered.'
                  : 'Username is already taken.',
            },
          ],
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const user = (await this.userModel.create({
        username: body.username,
        Fname: body.Fname,
        Lname: body.Lname,
        email: body.email,
        password: body.password,
        loginStreak: {
          current: 1,
          longest: 1,
          lastLoginDate: new Date(),
        },
      })) as UserDoc;

      const { accessToken, refreshToken } = this.issueTokenPair(this.getUserObjectId(user));
      this.setAuthCookies(res, accessToken, refreshToken);

      user.refreshTokenHash = this.hashToken(refreshToken);
      user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
      await this.issueVerificationEmail(user);
      await user.save();

      return {
        success: true,
        message: 'User created successfully',
        accessToken,
        user: this.toPublicUser(user),
      };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new HttpException(
          {
            success: false,
            message: 'Validation failed.',
            errors: [{ field: 'email', message: 'Email or username already exists.' }],
          },
          HttpStatus.CONFLICT,
        );
      }

      this.logger.error('Signup Error Details', (error as Error).stack, 'AuthService');
      throw new HttpException('Registration failed.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyEmail(body: VerifyEmailBody) {
    const user = (await this.userModel.findOne({
      verificationToken: body.code,
      verificationTokenExpireAt: { $gt: new Date() },
    })) as UserDoc | null;

    if (!user) {
      throw new HttpException('Invalid verification code.', HttpStatus.BAD_REQUEST);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();
    await this.sendWelcomeEmail(user);

    return {
      success: true,
      message: 'Email verified successfully.',
    };
  }

  async resendVerificationCode(body: EmailBody) {
    const user = (await this.userModel.findOne({ email: body.email })) as UserDoc | null;

    if (user && user.isVerified !== true) {
      await this.issueVerificationEmail(user);
      await user.save();
    }

    return {
      success: true,
      message:
        'If an account with that email exists, a new verification code has been sent.',
    };
  }

  async login(body: LoginBody, req: Request, res: Response) {
    await this.purgeDueDeletedAccounts();

    const user = (await this.userModel
      .findOne({
        $or: [{ email: body.identifier }, { username: body.identifier }],
      })
      .select('+password')) as UserDoc | null;

    if (!user) {
      throw new HttpException('Invalid email/username or password.', HttpStatus.UNAUTHORIZED);
    }

    const deletionStatus = user.accountDeletion?.status || 'none';
    const isDeletionScheduled = deletionStatus === 'scheduled';
    const isSelfDeactivated =
      user.isActive === false && !user.deactivatedBy && !isDeletionScheduled;

    if (user.isActive === false && isDeletionScheduled) {
      throw new HttpException(
        'This account is scheduled for deletion. Use the undo deletion flow before logging in.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.isActive === false && !isSelfDeactivated) {
      throw new HttpException('This account is deactivated. Please contact support.', HttpStatus.FORBIDDEN);
    }

    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      const unlockTime = new Date(user.lockUntil).toLocaleString();
      throw new HttpException(
        `Account locked until ${unlockTime} due to multiple failed login attempts.`,
        HttpStatus.LOCKED,
      );
    }

    const isPasswordCorrect = await user.comparePassword(String(body.password));

    if (!isPasswordCorrect) {
      const maxFailed = Number(this.configService.get<string>('MAX_FAILED_LOGIN')) || 8;
      const lockTime =
        Number(this.configService.get<string>('ACCOUNT_LOCK_TIME_MS')) || 30 * 60 * 1000;

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= maxFailed) {
        user.lockUntil = new Date(Date.now() + lockTime);
      }
      await user.save();

      throw new HttpException('Invalid email/username or password.', HttpStatus.UNAUTHORIZED);
    }

    if (user.isVerified === false) {
      throw new HttpException('Email not verified.', HttpStatus.UNAUTHORIZED);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    if (isSelfDeactivated) {
      user.isActive = true;
      user.deactivatedAt = undefined;
      user.deactivatedBy = undefined;
      user.deactivationReason = undefined;
    }

    const { accessToken, refreshToken } = this.issueTokenPair(this.getUserObjectId(user));
    this.setAuthCookies(res, accessToken, refreshToken);

    user.refreshTokenHash = this.hashToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
    user.lastLogin = new Date();
    this.updateLoginStreak(user, user.lastLogin);
    await user.save();
    await this.recordLoginActivity(req, user);

    return {
      success: true,
      message: isSelfDeactivated ? 'Account reactivated successfully.' : 'Login successful.',
      accessToken,
      user: this.toPublicUser(user),
    };
  }

  async refresh(res: Response, refreshToken?: string) {
    if (!refreshToken) {
      this.clearAuthCookies(res);
      throw new HttpException('Refresh token missing. Please log in again.', HttpStatus.UNAUTHORIZED);
    }

    try {
      const decoded = jwt.verify(refreshToken, this.getJwtSecret()) as JwtPayload;
      const user = (await this.userModel
        .findById(decoded.id)
        .select('+refreshTokenHash +password')) as UserDoc | null;

      if (!user || !user.refreshTokenHash) {
        this.clearAuthCookies(res);
        throw new HttpException('Refresh token invalid. Please log in again.', HttpStatus.UNAUTHORIZED);
      }

      if (user.isActive === false) {
        this.clearAuthCookies(res);
        throw new HttpException('This account is deactivated. Please contact support.', HttpStatus.FORBIDDEN);
      }

      if (user.refreshTokenExpiresAt && new Date(user.refreshTokenExpiresAt).getTime() < Date.now()) {
        user.refreshTokenHash = undefined;
        user.refreshTokenExpiresAt = undefined;
        await user.save();
        this.clearAuthCookies(res);
        throw new HttpException('Refresh token expired. Please log in again.', HttpStatus.UNAUTHORIZED);
      }

      if (this.hashToken(refreshToken) !== user.refreshTokenHash) {
        this.clearAuthCookies(res);
        throw new HttpException('Refresh token mismatch. Please log in again.', HttpStatus.UNAUTHORIZED);
      }

      if (user.passwordChangedAt && decoded.iat) {
        const passwordChangedAt = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
        if (decoded.iat < passwordChangedAt) {
          this.clearAuthCookies(res);
          throw new HttpException(
            'User recently changed password. Please log in again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      const nextAccessToken = this.issueAccessToken(this.getUserObjectId(user));
      const nextRefreshToken = this.issueRefreshToken(this.getUserObjectId(user));
      this.setAuthCookies(res, nextAccessToken, nextRefreshToken);

      user.refreshTokenHash = this.hashToken(nextRefreshToken);
      user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
      await user.save();

      return {
        success: true,
        accessToken: nextAccessToken,
        user: this.toPublicUser(user),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.clearAuthCookies(res);
      throw new HttpException('Session expired. Please log in again.', HttpStatus.UNAUTHORIZED);
    }
  }

  async forgotPassword(body: EmailBody) {
    const user = (await this.userModel.findOne({ email: body.email })) as UserDoc | null;

    if (user) {
      await this.issuePasswordResetEmail(user);
      await user.save();
    }

    return {
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resendResetPassword(body: EmailBody) {
    const user = (await this.userModel.findOne({ email: body.email })) as UserDoc | null;

    if (user) {
      await this.issuePasswordResetEmail(user);
      await user.save();
    }

    return {
      success: true,
      message:
        'If an account with that email exists, a new password reset link has been sent.',
    };
  }

  async resetPassword(token: string, body: ResetPasswordBody, req: Request) {
    const hashedToken = this.hashToken(token);
    const user = (await this.userModel
      .findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpireAt: { $gt: new Date() },
      })
      .select('+password')) as UserDoc | null;

    if (!user) {
      throw new HttpException('Invalid or expired reset password link.', HttpStatus.BAD_REQUEST);
    }

    user.password = body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpireAt = undefined;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();
    await this.sendResetSuccessEmail(user, req);

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  }

  async logout(res: Response, user?: AuthenticatedUser) {
    if (user?.id) {
      await this.userModel.findByIdAndUpdate(user.id, {
        $unset: {
          refreshTokenHash: '',
          refreshTokenExpiresAt: '',
        },
      });
    }

    this.clearAuthCookies(res);

    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  async checkAuth(user: AuthenticatedUser) {
    const userRecord = (await this.userModel.findById(user.id)) as UserDoc | null;

    if (!userRecord) {
      throw new HttpException('Unauthorized. Please log in again.', HttpStatus.UNAUTHORIZED);
    }

    const hasPreferences = await this.userPreferenceModel.exists({ user: userRecord._id });

    return {
      success: true,
      authenticated: true,
      user: this.toPublicUser(userRecord, { hasPreferences: Boolean(hasPreferences) }),
    };
  }

  private issueTokenPair(userId: Types.ObjectId | string) {
    const accessToken = this.issueAccessToken(userId);
    const refreshToken = this.issueRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private issueAccessToken(userId: Types.ObjectId | string) {
    return jwt.sign({ id: userId.toString() }, this.getJwtSecret(), {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private issueRefreshToken(userId: Types.ObjectId | string) {
    return jwt.sign({ id: userId.toString() }, this.getJwtSecret(), {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private getJwtSecret() {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new HttpException('Server auth configuration error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return jwtSecret;
  }

  private getAccessTokenCookieOptions() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    } as const;
  }

  private getRefreshTokenCookieOptions() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    } as const;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, this.getAccessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, this.getRefreshTokenCookieOptions());
    res.cookie('token', accessToken, this.getAccessTokenCookieOptions());
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', this.getAccessTokenCookieOptions());
    res.clearCookie('refreshToken', this.getRefreshTokenCookieOptions());
    res.clearCookie('token', this.getAccessTokenCookieOptions());
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueVerificationEmail(user: UserDoc) {
    const verificationToken = generateVerificationToken();

    user.verificationToken = verificationToken;
    user.verificationTokenExpireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.sendVerificationEmail(user, verificationToken);
  }

  private async issuePasswordResetEmail(user: UserDoc) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = this.hashToken(resetToken);
    user.resetPasswordExpireAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.sendPasswordResetEmail(user, resetToken);
  }

  private async sendVerificationEmail(user: UserDoc, verificationToken: string) {
    await this.sendMailSafely('verification email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Verify your ILMA account with your token',
        text: `Hello ${this.getFullName(user)},\n\nYour ILMA verification token is:\n\n${verificationToken}\n\nThis token expires soon.\n\nILMA Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Your ILMA verification token is:</p><h2>${verificationToken}</h2><p>This token expires soon.</p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Verification Email',
        },
      }),
    );
  }

  private async sendWelcomeEmail(user: UserDoc) {
    await this.sendMailSafely('welcome email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Welcome to ILMA',
        text: `Hello ${this.getFullName(user)},\n\nWelcome to ILMA.\n\nYour account has been created successfully.\n\nILMA Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Welcome to ILMA. Your account has been created successfully.</p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Welcome Email',
        },
      }),
    );
  }

  private async sendPasswordResetEmail(user: UserDoc, resetToken: string) {
    const resetUrl = this.buildResetPasswordUrl(resetToken, user.email);

    await this.sendMailSafely('password reset email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Reset your ILMA password',
        text: `Hello ${this.getFullName(user)},\n\nOpen this link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nILMA Security Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Open this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Password Reset Email',
        },
      }),
    );
  }

  private async sendResetSuccessEmail(user: UserDoc, req: Request) {
    const resetTime = new Date().toLocaleString('en-US', {
      timeZone: STREAK_TIME_ZONE,
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    const ipAddress = this.getRequestIp(req);
    const device = req.headers['user-agent'] || 'Unknown';

    await this.sendMailSafely('password reset success email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Your ILMA password was reset',
        text: `Hello ${this.getFullName(user)},\n\nYour ILMA password was reset successfully.\n\nReset time: ${resetTime}\nIP Address: ${ipAddress}\nDevice: ${device}\n\nILMA Security Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Your ILMA password was reset successfully.</p><p>Reset time: ${resetTime}<br />IP Address: ${this.escapeHtml(ipAddress)}<br />Device: ${this.escapeHtml(String(device))}</p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Password Reset Success Email',
        },
      }),
    );
  }

  private async sendMailSafely(action: string, send: () => Promise<unknown>) {
    try {
      await send();
    } catch (error) {
      this.logger.warn(`Unable to send ${action}`, {
        message: (error as Error).message,
      });
    }
  }

  private buildResetPasswordUrl(token: string, email: string) {
    const frontendOrigin = this.getFrontendOrigin();
    const url = new URL(`/reset-password/${token}`, frontendOrigin);
    url.searchParams.set('email', email);

    return url.toString();
  }

  private getFrontendOrigin() {
    const configuredOrigins = [
      this.configService.get<string>('CLIENT_URL', ''),
      this.configService.get<string>('FRONTEND_URL', ''),
      this.configService.get<string>('PRODUCTION_URL', ''),
    ]
      .join(',')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return configuredOrigins.find((origin) => this.isLocalOrigin(origin)) || 'http://localhost:5173';
    }

    return (
      configuredOrigins.find((origin) => !this.isLocalOrigin(origin)) ||
      configuredOrigins[0] ||
      'http://localhost:5173'
    );
  }

  private isLocalOrigin(origin: string) {
    try {
      const { hostname } = new URL(origin);
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    } catch {
      return false;
    }
  }

  private toPublicUser(user: UserDoc, options: { hasPreferences?: boolean } = {}) {
    return {
      _id: user._id,
      username: user.username,
      Fname: user.Fname,
      Lname: user.Lname,
      name: this.getFullName(user),
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      loginStreak: {
        current: user.loginStreak?.current ?? 0,
        longest: user.loginStreak?.longest ?? 0,
        lastLoginDate: user.loginStreak?.lastLoginDate ?? null,
      },
      subscription: {
        plan: user.subscription?.plan || 'free',
        status: user.subscription?.status || 'inactive',
        currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
      },
      accountDeletion: {
        status: user.accountDeletion?.status || 'none',
        requestedAt: user.accountDeletion?.requestedAt ?? null,
        scheduledFor: user.accountDeletion?.scheduledFor ?? null,
      },
      hasPreferences: Boolean(options.hasPreferences),
    };
  }

  private updateLoginStreak(user: UserDoc, now = new Date()) {
    const todayKey = this.getStreakDateKey(now);
    const streak = user.loginStreak ?? {};
    const lastLoginDate = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null;
    const lastLoginKey = lastLoginDate ? this.getStreakDateKey(lastLoginDate) : null;

    if (lastLoginKey === todayKey) {
      user.loginStreak = {
        current: streak.current ?? 1,
        longest: Math.max(streak.longest ?? 0, streak.current ?? 1),
        lastLoginDate: lastLoginDate ?? now,
      };
      return;
    }

    const current =
      lastLoginKey && this.dayNumberFromKey(todayKey) - this.dayNumberFromKey(lastLoginKey) === 1
        ? (streak.current ?? 0) + 1
        : 1;

    user.loginStreak = {
      current,
      longest: Math.max(streak.longest ?? 0, current),
      lastLoginDate: now,
    };
  }

  private getStreakDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: STREAK_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private dayNumberFromKey(key: string) {
    const [year, month, day] = key.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  private async recordLoginActivity(req: Request, user: UserDoc) {
    try {
      await this.userActivityModel.create({
        user: user._id,
        type: 'login',
        device: req.headers['user-agent'] || 'Unknown',
        ipAddress: this.getRequestIp(req),
        occurredAt: new Date(),
      });
    } catch (error) {
      this.logger.warn('Unable to record login activity', {
        message: (error as Error).message,
      });
    }
  }

  private async purgeDueDeletedAccounts() {
    await this.userModel.deleteMany({
      'accountDeletion.status': 'scheduled',
      'accountDeletion.scheduledFor': { $lte: new Date() },
    });
  }

  private getRequestIp(req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    return (
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'Unknown'
    );
  }

  private getFullName(user: UserDoc) {
    return `${user.Fname || ''} ${user.Lname || ''}`.trim() || user.username || user.email;
  }

  private getUserObjectId(user: UserDoc) {
    return user._id as Types.ObjectId;
  }

  private escapeHtml(value: string) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
