import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import {
  CreateUserInput,
  UpdateUserInput,
  UsersPaginatedResult,
  LoggedUserInput,
  AuthResponse,
  VerifyResponse,
} from '../dto/user.input';
import { User } from '../entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { GraphQLException } from 'exceptions/graphql-exception';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    try {
      return await this.userService.create(createUserInput);
    } catch (error) {
      throw new GraphQLException(
        'Failed to create user: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => AuthResponse)
  async loggedUser(
    @Args('loggedUserInput') loggedUserInput: LoggedUserInput,
  ): Promise<AuthResponse> {
    try {
      return await this.userService.loggedUser(loggedUserInput);
    } catch (error) {
      throw new GraphQLException(
        'Failed to logged User : ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => VerifyResponse)
  async verifiedUser(
    @Args('verifyCode') verifyCode: string,
    @Args('userId') userId: number,
  ): Promise<VerifyResponse> {
    try {
      return await this.userService.verifiedUser(verifyCode, userId);
    } catch (error) {
      throw new GraphQLException(
        'Failed to verified User : ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => UsersPaginatedResult)
  async users(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
  ): Promise<UsersPaginatedResult> {
    try {
      return await this.userService.findAll(page, limit);
    } catch (error) {
      throw new GraphQLException(
        'Failed to fetch users: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => User)
  async user(@Args('id', { type: () => Int }) id: number): Promise<User> {
    try {
      return await this.userService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(`User with ID ${id} not found`, 'NOT_FOUND');
      }
      throw new GraphQLException(
        'Failed to fetch user: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    try {
      return await this.userService.update(id, updateUserInput);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(`User with ID ${id} not found`, 'NOT_FOUND');
      }
      throw new GraphQLException(
        'Failed to update user: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => User)
  async removeUser(@Args('id', { type: () => Int }) id: number): Promise<User> {
    try {
      return await this.userService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(`User with ID ${id} not found`, 'NOT_FOUND');
      }
      throw new GraphQLException(
        'Failed to remove user: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => UsersPaginatedResult)
  async searchUsers(
    @Args('query', { type: () => String, nullable: true }) query?: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('role', { type: () => ROLE_TYPE, nullable: true }) role?: ROLE_TYPE,
    @Args('location', { type: () => String, nullable: true }) location?: string,
    @Args('product', { type: () => String, nullable: true }) product?: string,
    @Args('minReviewCount', { type: () => Int, nullable: true })
    minReviewCount?: number,
    @Args('maxReviewCount', { type: () => Int, nullable: true })
    maxReviewCount?: number,
    @Args('minRating', { type: () => Int, nullable: true })
    minRating?: number,
  ): Promise<UsersPaginatedResult> {
    try {
      return await this.userService.search(
        query,
        page,
        limit,
        role,
        location,
        product,
        minReviewCount,
        maxReviewCount,
        minRating,
      );
    } catch (error) {
      throw new GraphQLException(
        'Failed to search users: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
