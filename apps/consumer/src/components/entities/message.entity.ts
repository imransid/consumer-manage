import { Field, Int, ObjectType } from '@nestjs/graphql';

// message/entities/message.entity.ts
@ObjectType()
export class Message {
  @Field(() => Int)
  id: number;

  @Field()
  content: string;

  @Field(() => Int)
  senderId: number;

  @Field(() => Int)
  receiverId: number;

  @Field()
  createdAt: Date;
}
