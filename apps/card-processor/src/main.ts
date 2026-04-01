import { NestFactory } from '@nestjs/core';
import { CardProcessorModule } from './card-processor.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CardProcessorModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'card-processor',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        consumer: {
          groupId: 'card-processor-group',
        },
      },
    },
  );
  app.useLogger(app.get(Logger));
  await app.listen();
}
bootstrap();
