// dto/create-notification.input.ts

import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateNotificationInput {
  @Field()
  message: string;

  @Field()
  type: string;

  @Field(() => Int)
  userId: number;
}
