import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';
import { GraphQLJSON } from 'graphql-type-json';

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

  @Field()
  password: string;

  @Field({ nullable: true })
  isVerified?: boolean;

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

  @Field(() => GraphQLJSON, { nullable: true })
  activity?: any;
}
