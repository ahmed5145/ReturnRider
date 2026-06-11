import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !corsOrigins?.length) {
    console.warn(
      '[ReturnRider] CORS_ORIGINS not set — allowing all origins. Set a comma-separated allowlist before public launch.',
    );
  }
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  });
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'legal/terms', method: RequestMethod.GET },
      { path: 'legal/privacy', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ReturnRider API')
    .setDescription('Automated Return & Refund Tracker')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (
    process.env.NODE_ENV === 'production' &&
    (process.env.ALLOW_DEV_AUTH === 'true' || process.env.ALLOW_DEV_AUTH === '1')
  ) {
    console.warn(
      '[ReturnRider] ALLOW_DEV_AUTH is enabled in production — disable before public launch (see docs/STAGING_DEPLOY.md).',
    );
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`ReturnRider API listening on http://localhost:${port} (LAN: use your PC IPv4)`);
}

bootstrap();
