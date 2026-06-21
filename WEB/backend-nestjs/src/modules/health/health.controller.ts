import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'backend-api',
    };
  }

  @Get()
  root() {
    return {
      message: 'backend is running',
      health: '/api/health',
    };
  }
}
