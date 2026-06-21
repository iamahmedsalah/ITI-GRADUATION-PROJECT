import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { RateLimiterGuard } from '../../core/rate-limiter/rate-limiter.guard';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { ContactService } from './contact.service';
import { contactBodySchema, ContactBody } from './contact.schemas';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(RateLimiterGuard)
  @Throttle({
    default: {
      ttl: 15 * 60 * 1000,
      limit: Number(process.env.CONTACT_RATE_LIMIT || 5),
    },
  })
  sendContactMessage(
    @Body(new ZodValidationPipe(contactBodySchema)) body: ContactBody,
    @Req() req: Request,
  ) {
    return this.contactService.sendContactMessage(body, req);
  }
}
