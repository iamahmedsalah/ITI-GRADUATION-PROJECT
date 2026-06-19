import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
      'http://localhost:5000',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roadmap Service API')
    .setDescription('API for managing roadmaps and topics')
    .setVersion('1.0')
    .addServer('/')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('docs', app, swaggerDocument);

  let port =
    configService.get<number>('NESTJS_PORT') ||
    configService.get<number>('app.port') ||
    configService.get<number>('PORT') ||
    3000;

  if (Number(port) === 5000) {
    port = 3000; // Fallback to 3000 if it detects the Express gateway port 5000
  }

  await app.listen(port, '0.0.0.0');

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs running on http://localhost:${port}/docs`);
}

bootstrap();
