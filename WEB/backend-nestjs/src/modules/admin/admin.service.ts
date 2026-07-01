import * as crypto from 'node:crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import { AppLoggerService } from '../../core/logger/logger.service';
import { MailService } from '../../core/mail/mail.service';
import { UserDocument } from '../../database/schemas';
import { EmailBody, LoginBody, ResetPasswordBody, VerifyEmailBody } from '../auth/auth.schemas';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '1d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ADMIN_RESET_PATH_PREFIX = '/en/admin/reset-password';
const TIME_ZONE = 'Africa/Cairo';

type UserDoc = UserDocument & Record<string, any>;

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly logger: AppLoggerService,
  ) {}

  async login(body: LoginBody, res: Response) {
    const user = (await this.userModel
      .findOne({
        $or: [{ email: body.identifier }, { username: body.identifier }],
      })
      .select('+password')) as UserDoc | null;

    if (!user || user.role !== 'admin') {
      throw new HttpException('Invalid admin credentials.', HttpStatus.UNAUTHORIZED);
    }

    if (user.isActive === false) {
      throw new HttpException('This admin account is deactivated.', HttpStatus.FORBIDDEN);
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
      const maxFailed = Number(this.configService.get<string>('MAX_FAILED_LOGIN')) || 5;
      const lockTime =
        Number(this.configService.get<string>('ACCOUNT_LOCK_TIME_MS')) || 30 * 60 * 1000;

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= maxFailed) {
        user.lockUntil = new Date(Date.now() + lockTime);
      }
      await user.save();

      throw new HttpException('Invalid admin credentials.', HttpStatus.UNAUTHORIZED);
    }

    if (user.isVerified === false) {
      throw new HttpException('Admin email not verified.', HttpStatus.UNAUTHORIZED);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    const { accessToken, refreshToken } = this.issueTokenPair(this.getUserObjectId(user));
    this.setAuthCookies(res, accessToken, refreshToken);

    user.refreshTokenHash = this.hashToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
    await user.save();

    return {
      success: true,
      message: 'Admin login successful.',
      accessToken,
      user: this.toPublicAdmin(user),
    };
  }

  async verifyEmail(body: VerifyEmailBody) {
    const user = (await this.userModel.findOne({
      verificationToken: body.code,
      verificationTokenExpireAt: { $gt: new Date() },
      role: 'admin',
    })) as UserDoc | null;

    if (!user) {
      throw new HttpException('Invalid admin verification code.', HttpStatus.BAD_REQUEST);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();
    await this.sendWelcomeEmail(user);

    return {
      success: true,
      message: 'Admin email verified successfully.',
    };
  }

  async forgotPassword(body: EmailBody) {
    const user = (await this.userModel.findOne({
      email: body.email,
      role: 'admin',
    })) as UserDoc | null;

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

  async resetPassword(token: string, body: ResetPasswordBody, req: Request) {
    const hashedToken = this.hashToken(token);
    const user = (await this.userModel
      .findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpireAt: { $gt: new Date() },
        role: 'admin',
      })
      .select('+password')) as UserDoc | null;

    if (!user) {
      throw new HttpException('Invalid or expired admin reset link.', HttpStatus.BAD_REQUEST);
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
      message: 'Admin password reset successfully.',
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
      message: 'Admin logged out successfully.',
    };
  }

  async checkAuth(user: AuthenticatedUser) {
    const userRecord = (await this.userModel.findById(user.id)) as UserDoc | null;

    if (!userRecord || userRecord.role !== 'admin') {
      throw new HttpException('Unauthorized admin access.', HttpStatus.UNAUTHORIZED);
    }

    return {
      success: true,
      authenticated: true,
      user: this.toPublicAdmin(userRecord),
    };
  }

  private issueTokenPair(userId: Types.ObjectId | string) {
    return {
      accessToken: this.issueToken(userId, ACCESS_TOKEN_EXPIRES_IN),
      refreshToken: this.issueToken(userId, REFRESH_TOKEN_EXPIRES_IN),
    };
  }

  private issueToken(userId: Types.ObjectId | string, expiresIn: string) {
    return jwt.sign({ id: userId.toString() }, this.getJwtSecret(), {
      expiresIn,
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

  private async issuePasswordResetEmail(user: UserDoc) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = this.hashToken(resetToken);
    user.resetPasswordExpireAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.sendPasswordResetEmail(user, resetToken);
  }

  private async sendPasswordResetEmail(user: UserDoc, resetToken: string) {
    const resetUrl = this.buildAdminResetPasswordUrl(resetToken);

    await this.sendMailSafely('admin password reset email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Reset your ILMA admin password',
        text: `Hello ${this.getFullName(user)},\n\nOpen this link to reset your admin password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nILMA Security Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Open this link to reset your admin password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Admin Password Reset Email',
        },
      }),
    );
  }

  private async sendWelcomeEmail(user: UserDoc) {
    await this.sendMailSafely('admin welcome email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Welcome to ILMA Admin',
        text: `Hello ${this.getFullName(user)},\n\nYour ILMA admin email has been verified.\n\nILMA Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Your ILMA admin email has been verified.</p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Admin Welcome Email',
        },
      }),
    );
  }

  private async sendResetSuccessEmail(user: UserDoc, req: Request) {
    const resetTime = new Date().toLocaleString('en-US', {
      timeZone: TIME_ZONE,
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    const ipAddress = this.getRequestIp(req);
    const device = req.headers['user-agent'] || 'Unknown';

    await this.sendMailSafely('admin password reset success email', async () =>
      this.mailService.sendMail({
        to: user.email,
        subject: 'Your ILMA admin password was reset',
        text: `Hello ${this.getFullName(user)},\n\nYour ILMA admin password was reset successfully.\n\nReset time: ${resetTime}\nIP Address: ${ipAddress}\nDevice: ${device}\n\nILMA Security Team`,
        html: `<p>Hello ${this.escapeHtml(this.getFullName(user))},</p><p>Your ILMA admin password was reset successfully.</p><p>Reset time: ${resetTime}<br />IP Address: ${this.escapeHtml(ipAddress)}<br />Device: ${this.escapeHtml(String(device))}</p>`,
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Admin Password Reset Success Email',
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

  private buildAdminResetPasswordUrl(token: string) {
    return new URL(`${ADMIN_RESET_PATH_PREFIX}/${token}`, this.getFrontendOrigin()).toString();
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

  private toPublicAdmin(user: UserDoc) {
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
    };
  }

  private getUserObjectId(user: UserDoc) {
    return user._id as Types.ObjectId;
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

  private escapeHtml(value: string) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
