import { NestFactory } from '@nestjs/core';
import { CardProcessorModule } from './card-processor.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

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
  await app.listen();
}
bootstrap();
