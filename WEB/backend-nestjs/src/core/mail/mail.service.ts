import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter | null;
  private readonly sender: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST') || this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('EMAIL_USER') || this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS') || this.configService.get<string>('MAIL_PASS');
    const port = Number(
      this.configService.get<string>('EMAIL_PORT') || this.configService.get<string>('MAIL_PORT') || 587,
    );

    this.sender = user;

    if (!host || !user || !pass) {
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user,
        pass,
      },
      tls: {
        ciphers: 'SSLv3',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }

  sendMail(options: nodemailer.SendMailOptions) {
    if (!this.transporter || !this.sender) {
      const error = new Error('Email service is not configured.') as Error & { status?: number };
      error.status = 503;
      throw error;
    }

    return this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM') || this.sender,
      ...options,
    });
  }

  getSender() {
    return this.sender;
  }
}
