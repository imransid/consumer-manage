import { Module } from '@nestjs/common';
import { PrismaConsumerService } from './prisma-hr.service';

@Module({
  providers: [PrismaConsumerService],
  exports: [PrismaConsumerService],
})
export class PrismaModule {}
