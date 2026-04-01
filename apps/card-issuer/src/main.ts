import { NestFactory } from '@nestjs/core';
import { CardIssuerModule } from './card-issuer.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(CardIssuerModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.ISSUER_PORT || 3000);
}
bootstrap();
