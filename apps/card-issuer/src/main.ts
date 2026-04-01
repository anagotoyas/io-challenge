import { NestFactory } from '@nestjs/core';
import { CardIssuerModule } from './card-issuer.module';

async function bootstrap() {
  const app = await NestFactory.create(CardIssuerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
