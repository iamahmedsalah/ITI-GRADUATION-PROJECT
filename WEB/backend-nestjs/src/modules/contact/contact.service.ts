import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { MailService } from '../../core/mail/mail.service';
import { AppLoggerService } from '../../core/logger/logger.service';
import { ContactMessageDocument } from '../../database/schemas';
import { ContactBody } from './contact.schemas';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel('ContactMessage')
    private readonly contactMessageModel: Model<ContactMessageDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly logger: AppLoggerService,
  ) {}

  async sendContactMessage(body: ContactBody, req: Request) {
    let contactRecord: ContactMessageDocument | null = null;

    try {
      contactRecord = await this.createContactRecord(body, req);
      const sender = this.mailService.getSender();
      const recipient =
        this.configService.get<string>('CONTACT_RECEIVER_EMAIL') ||
        this.configService.get<string>('SUPPORT_EMAIL') ||
        sender;

      if (!sender || !recipient) {
        throw new HttpException('Contact recipient email is not configured.', 503);
      }

      const htmlMessage = escapeHtml(body.message).replace(/\n/g, '<br />');
      const result = await this.mailService.sendMail({
        from: `"ILMA Contact Form" <${sender}>`,
        to: recipient,
        replyTo: { name: body.name, address: body.email },
        subject: `New contact message from ${body.name}`,
        text: `New contact form message

Name: ${body.name}
Email: ${body.email}

Message:
${body.message}`,
        html: buildContactEmail({
          name: body.name,
          email: body.email,
          message: htmlMessage,
        }),
        headers: {
          'X-Mailer': 'ILMA Backend',
          'X-Category': 'Contact Form',
        },
      });

      this.logger.log(`Contact email sent successfully: ${result.messageId}`);

      if (contactRecord) {
        contactRecord.set('adminNotificationMessageId', result.messageId);
        await contactRecord.save();
      }

      return {
        success: true,
        message: 'Message sent successfully.',
        ...(contactRecord
          ? {
              data: {
                _id: contactRecord._id,
                status: contactRecord.get('status'),
                createdAt: contactRecord.get('createdAt'),
              },
            }
          : {}),
      };
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.error(`Error sending contact email from ${body.email}: ${err.message}`, err.stack);

      try {
        if (contactRecord) {
          contactRecord.set('adminNotificationError', err.message);
          await contactRecord.save();
        }
      } catch (updateError) {
        this.logger.warn('Failed to mark contact email notification error', {
          from: body.email,
          errorMessage: (updateError as Error).message,
        });
      }

      if (err.status) {
        throw new HttpException(err.message, err.status);
      }

      throw error;
    }
  }

  private async createContactRecord(body: ContactBody, req: Request) {
    if (this.connection.readyState !== 1) {
      this.logger.warn('Contact message was not stored because MongoDB is not connected', {
        from: body.email,
      });
      return null;
    }

    return this.contactMessageModel.create({
      ...body,
      ipAddress: getRequestIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  }
}

const getRequestIp = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  return (
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

const escapeHtml = (value: string) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildContactEmail = ({ name, email, message }: ContactBody) => `
<!DOCTYPE html>
<html lang="en">
  <body>
    <h1>New contact message</h1>
    <p>A visitor sent a message through the ILMA contact form.</p>
    <table>
      <tr><td>Name</td><td>${escapeHtml(name)}</td></tr>
      <tr><td>Email</td><td>${escapeHtml(email)}</td></tr>
    </table>
    <h2>Message</h2>
    <p>${message}</p>
  </body>
</html>
`;
