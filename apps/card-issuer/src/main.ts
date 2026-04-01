import { NestFactory } from '@nestjs/core';
import { CardIssuerModule } from './card-issuer.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(CardIssuerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('IO Card Issuer API')
    .setDescription('API de emisión de tarjetas para IO')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.ISSUER_PORT || 3000);
}
bootstrap();
