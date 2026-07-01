import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import {
  emailBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  signupBodySchema,
  verifyEmailBodySchema,
  EmailBody,
  LoginBody,
  ResetPasswordBody,
  SignupBody,
  VerifyEmailBody,
} from './auth.schemas';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(
    @Body(new ZodValidationPipe(signupBodySchema)) body: SignupBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signup(body, res);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body(new ZodValidationPipe(verifyEmailBodySchema)) body: VerifyEmailBody) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification-code')
  @HttpCode(HttpStatus.OK)
  resendVerificationCode(@Body(new ZodValidationPipe(emailBodySchema)) body: EmailBody) {
    return this.authService.resendVerificationCode(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(body, req, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(res, req.cookies?.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body(new ZodValidationPipe(emailBodySchema)) body: EmailBody) {
    return this.authService.forgotPassword(body);
  }

  @Post('resend-reset-password')
  @HttpCode(HttpStatus.OK)
  resendResetPassword(@Body(new ZodValidationPipe(emailBodySchema)) body: EmailBody) {
    return this.authService.resendResetPassword(body);
  }

  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(resetPasswordBodySchema)) body: ResetPasswordBody,
    @Req() req: Request,
  ) {
    return this.authService.resetPassword(token, body, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(
    @GetUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(res, user);
  }

  @Get('check-auth')
  @UseGuards(JwtAuthGuard)
  checkAuth(@GetUser() user: AuthenticatedUser) {
    return this.authService.checkAuth(user);
  }
}
