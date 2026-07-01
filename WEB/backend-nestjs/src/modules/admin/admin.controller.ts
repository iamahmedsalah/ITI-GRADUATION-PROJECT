import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import {
  emailBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
  EmailBody,
  LoginBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from '../auth/auth.schemas';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AdminService } from './admin.service';
import { AdminRoleGuard } from './guards/admin-role.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.adminService.login(body, res);
  }

  @Post('auth/verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body(new ZodValidationPipe(verifyEmailBodySchema)) body: VerifyEmailBody) {
    return this.adminService.verifyEmail(body);
  }

  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body(new ZodValidationPipe(emailBodySchema)) body: EmailBody) {
    return this.adminService.forgotPassword(body);
  }

  @Post('auth/reset-password/:token')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(resetPasswordBodySchema)) body: ResetPasswordBody,
    @Req() req: Request,
  ) {
    return this.adminService.resetPassword(token, body, req);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  logout(
    @GetUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.adminService.logout(res, user);
  }

  @Get('auth/check-auth')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  checkAuth(@GetUser() user: AuthenticatedUser) {
    return this.adminService.checkAuth(user);
  }
}
