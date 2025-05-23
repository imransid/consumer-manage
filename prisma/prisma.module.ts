import { Module } from '@nestjs/common';
import { PrismaconsumerService } from './prisma-consumer.service';

@Module({
  providers: [PrismaconsumerService],
  exports: [PrismaconsumerService],
})
export class PrismaModule {}
