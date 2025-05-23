import { Controller, Get } from '@nestjs/common';

@Controller()
export class consumerController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'WELCOME : TO consumer)';
  }
}
