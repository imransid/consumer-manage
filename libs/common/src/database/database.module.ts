import { Module } from '@nestjs/common';
import { PrismaconsumerService } from '../../../../prisma/prisma-consumer.service';

@Module({
  providers: [PrismaconsumerService],
})
export class DatabaseModule {}
