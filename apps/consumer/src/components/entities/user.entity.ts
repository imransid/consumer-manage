import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  storeName?: string;

  @Field({ nullable: true })
  storeAddress?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  products?: string;

  @Field({ nullable: true })
  schedule?: boolean;

  @Field({ nullable: true })
  photoUrl?: string;

  @Field(() => ROLE_TYPE, {
    defaultValue: ROLE_TYPE.CUSTOMER,
  })
  role: keyof typeof ROLE_TYPE;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}
