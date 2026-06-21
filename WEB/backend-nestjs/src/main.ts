import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AppLoggerService } from './core/logger/logger.service';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);

  app.useLogger(logger);
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Trust proxy (for rate limiting behind reverse proxies)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Cookie parser
  app.use(cookieParser());

  // Body parser limits
  const bodyLimit = configService.get<string>('REQUEST_BODY_LIMIT', '1mb');
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: false, limit: bodyLimit }));
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // CORS configuration
  const configuredOrigins = [
    configService.get<string>('FRONTEND_URL', ''),
    configService.get<string>('CLIENT_URL', ''),
    configService.get<string>('PRODUCTION_URL', ''),
  ]
    .join(',')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const staticAllowedOrigins = new Set(configuredOrigins);
  const allowVercelPreviewOrigins =
    configService.get<string>('ALLOW_VERCEL_PREVIEW_ORIGINS') === 'true';
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (staticAllowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      if (
        allowVercelPreviewOrigins &&
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      if (nodeEnv !== 'production') {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
          return callback(null, true);
        }
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  });

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ILMA API')
    .setDescription('ILMA - AI-powered SWE course recommendation platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 5000);

  await app.listen(port);
  logger.log(`Mode: In ${nodeEnv}`);
  logger.log(`Server is running on port ${port}`);
}

bootstrap();
