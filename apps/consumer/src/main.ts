import { NestFactory } from '@nestjs/core';
import { consumerModule } from './hr.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    consumerModule,
    // {
    //   transport: Transport.RMQ,
    //   options: {
    //     urls: ["amqp://user:password@rabbitmq:5672"],
    //     queue: "consumer_queue",
    //     queueOptions: {
    //       durable: false,
    //     },
    //   },
    // }
  );
  app.useGlobalPipes(new ValidationPipe());
  await app.listen();
}
bootstrap();
