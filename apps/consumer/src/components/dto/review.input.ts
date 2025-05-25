import {
  InputType,
  Field,
  Int,
  PartialType,
  ObjectType,
} from '@nestjs/graphql';
import { IsNotEmpty, IsInt, IsString, Min, Max } from 'class-validator';
import { Review } from '../entities/review.entity';

@InputType()
export class CreateReviewInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  comment: string;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  targetId: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  authorId: number;
}

@InputType()
export class UpdateReviewInput extends PartialType(CreateReviewInput) {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  id: number;
}

@ObjectType()
export class ReviewPaginatedResult {
  @Field(() => [Review], { defaultValue: [] })
  reviews: Review[] = [];

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalCount: number;

  constructor(
    reviews: Review[],
    totalPages: number,
    currentPage: number,
    totalCount: number,
  ) {
    this.reviews = reviews ?? [];
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.totalCount = totalCount;
  }
}
