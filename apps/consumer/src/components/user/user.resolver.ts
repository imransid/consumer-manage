import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import {
  CreateUserInput,
  UpdateUserInput,
  UsersPaginatedResult,
} from '../dto/user.input';
import { User } from '../entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { GraphQLException } from 'exceptions/graphql-exception';

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
    @Args('query', { type: () => String }) query: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
  ): Promise<UsersPaginatedResult> {
    try {
      return await this.userService.search(query, page, limit);
    } catch (error) {
      throw new GraphQLException(
        'Failed to search users: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
