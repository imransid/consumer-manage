import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { User } from './user.entity';
import { IsInt } from 'class-validator';

@ObjectType()
export class Review {
  @Field()
  id: string;

  @Field(() => Int)
  rating: number;

  @Field()
  comment: string;

  @Field(() => Int)
  @IsInt()
  authorId: number;

  @Field(() => Int)
  @IsInt()
  targetId: number;

  @Field(() => User, { nullable: true })
  author?: User;

  @Field(() => User, { nullable: true })
  target?: User;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class RatingsSummary {
  @Field(() => Float)
  average: number;

  @Field(() => Int)
  total: number;

  @Field(() => [Int])
  breakdown: number[]; // [1 star, 2 star, ..., 5 star]
}
