import { Field, Int, ObjectType } from '@nestjs/graphql';

// message/entities/message.entity.ts
@ObjectType()
export class ForgetPassword {
  @Field()
  message: string;
}
