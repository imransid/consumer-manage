// entities/notification.entity.ts

import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Notification {
  @Field(() => Int)
  id: number;

  @Field()
  message: string;

  @Field()
  type: string;

  @Field(() => Int)
  userId: number;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;
}
