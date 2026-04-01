import { NestFactory } from '@nestjs/core';
import { CardProcessorModule } from './card-processor.module';

async function bootstrap() {
  const app = await NestFactory.create(CardProcessorModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
