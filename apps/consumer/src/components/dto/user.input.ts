import {
  InputType,
  Field,
  Int,
  ObjectType,
  PartialType,
} from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

import { User } from '../entities/user.entity';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

@InputType()
export class LoggedUserInput {
  @Field()
  @IsString()
  email: string;

  @Field()
  @IsString()
  password: string;
}

@InputType()
export class CreateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  storeName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  storeAddress: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  password: string;

  @Field()
  @IsString()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  products: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  schedule: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @Field(() => ROLE_TYPE, {
    defaultValue: ROLE_TYPE.CUSTOMER,
  })
  role: keyof typeof ROLE_TYPE;
}

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => Int)
  @IsNotEmpty()
  id: number;
}

@ObjectType()
export class UsersPaginatedResult {
  @Field(() => [User], { defaultValue: [] })
  users: User[] = [];

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalCount: number;

  constructor(
    users: User[],
    totalPages: number,
    currentPage: number,
    totalCount: number,
  ) {
    this.users = users ?? [];
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.totalCount = totalCount;
  }
}

@ObjectType()
export class AuthResponse {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  token: string;

  @Field()
  userType: string;
}

@ObjectType()
export class VerifyResponse {
  @Field()
  message: string;
}
