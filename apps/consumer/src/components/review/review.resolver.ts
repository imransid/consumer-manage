import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewPaginatedResult,
} from '../dto/review.input';
import { RatingsSummary, Review } from '../entities/review.entity';
import { NotFoundException } from '@nestjs/common';
import { GraphQLException } from 'exceptions/graphql-exception';

@Resolver(() => Review)
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Mutation(() => Review)
  async createReview(
    @Args('createReviewInput') createReviewInput: CreateReviewInput,
  ): Promise<Review> {
    try {
      return await this.reviewService.create(createReviewInput);
    } catch (error) {
      throw new GraphQLException(
        'Failed to create review: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => ReviewPaginatedResult)
  async reviews(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
  ): Promise<ReviewPaginatedResult> {
    try {
      return await this.reviewService.findAll(page, limit);
    } catch (error) {
      throw new GraphQLException(
        'Failed to fetch reviews: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => Review)
  async review(@Args('id') id: string): Promise<Review> {
    try {
      return await this.reviewService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(
          `Review with ID ${id} not found`,
          'NOT_FOUND',
        );
      }
      throw new GraphQLException(
        'Failed to fetch review: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => Review)
  async updateReview(
    @Args('id') id: string,
    @Args('updateReviewInput') updateReviewInput: UpdateReviewInput,
  ): Promise<Review> {
    try {
      return await this.reviewService.update(id, updateReviewInput);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(
          `Review with ID ${id} not found`,
          'NOT_FOUND',
        );
      }
      throw new GraphQLException(
        'Failed to update review: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => Review)
  async removeReview(@Args('id') id: string): Promise<Review> {
    try {
      return await this.reviewService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(
          `Review with ID ${id} not found`,
          'NOT_FOUND',
        );
      }
      throw new GraphQLException(
        'Failed to remove review: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => ReviewPaginatedResult)
  async searchReviews(
    @Args('query', { type: () => String }) query: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
  ): Promise<ReviewPaginatedResult> {
    try {
      return await this.reviewService.search(query, page, limit);
    } catch (error) {
      throw new GraphQLException(
        'Failed to search reviews: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => RatingsSummary)
  async getRatingsSummary(@Args('userId') userId: number) {
    return this.reviewService.getRatingsSummary(userId);
  }
}
