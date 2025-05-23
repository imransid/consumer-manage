import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  firstName: string;

  @Field()
  storeName: string;

  @Field()
  storeAddress: string;

  @Field()
  email: string;

  @Field()
  products: string;

  @Field()
  schedule: boolean;

  @Field({ nullable: true })
  photoUrl?: string;

  @Field(() => ROLE_TYPE)
  role: ROLE_TYPE;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
