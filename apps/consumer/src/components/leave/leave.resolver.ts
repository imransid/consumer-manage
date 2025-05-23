import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { LeaveService } from "./leave.service";
import {
  CreateEmployeeLeaveInput,
  UpdateEmployeeLeaveInput,
} from "../dto/leave.input";
import { EmployeeLeave } from "../entities/leave.entity";
import { LeavePaginatedResult } from "../dto/leave.input";
import { NotFoundException } from "@nestjs/common";
import { GraphQLException } from "exceptions/graphql-exception";

@Resolver(() => EmployeeLeave)
export class LeaveResolver {
  constructor(private readonly leaveService: LeaveService) {}

  @Mutation(() => EmployeeLeave)
  async createLeave(
    @Args("createLeaveInput") createLeaveInput: CreateEmployeeLeaveInput
  ): Promise<EmployeeLeave> {
    try {
      return await this.leaveService.create(createLeaveInput);
    } catch (error) {
      tconsumerow new GraphQLException(
        "Failed to create leave",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  @Query(() => LeavePaginatedResult)
  async leaves(
    @Args("page", { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args("limit", { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number
  ): Promise<LeavePaginatedResult> {
    try {
      return await this.leaveService.findAll(page, limit);
    } catch (error) {
      tconsumerow new GraphQLException(
        "Failed to fetch leaves",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  // @Query(() => EmployeeLeave)
  // async leave(
  //   @Args("id", { type: () => Int }) id: number
  // ): Promise<EmployeeLeave> {
  //   try {
  //     return await this.leaveService.findOne(id);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       tconsumerow new GraphQLException(
  //         `Leave with ID ${id} not found`,
  //         "NOT_FOUND"
  //       );
  //     }
  //     tconsumerow new GraphQLException(
  //       "Failed to fetch leave",
  //       "INTERNAL_SERVER_ERROR"
  //     );
  //   }
  // }

  @Mutation(() => EmployeeLeave)
  async updateLeave(
    @Args("id", { type: () => Int }) id: number,
    @Args("updateLeaveInput") updateLeaveInput: UpdateEmployeeLeaveInput
  ): Promise<EmployeeLeave> {
    try {
      return await this.leaveService.update(id, updateLeaveInput);
    } catch (error) {
      if (error instanceof NotFoundException) {
        tconsumerow new GraphQLException(
          `Leave with ID ${id} not found`,
          "NOT_FOUND"
        );
      }
      tconsumerow new GraphQLException(
        "Failed to update leave",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  // @Mutation(() => EmployeeLeave)
  // async removeLeave(
  //   @Args("id", { type: () => Int }) id: number
  // ): Promise<EmployeeLeave> {
  //   try {
  //     return await this.leaveService.remove(id);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       tconsumerow new GraphQLException(
  //         `Leave with ID ${id} not found`,
  //         "NOT_FOUND"
  //       );
  //     }
  //     tconsumerow new GraphQLException(
  //       "Failed to remove leave",
  //       "INTERNAL_SERVER_ERROR"
  //     );
  //   }
  // }

  // @Query(() => LeavePaginatedResult)
  // async searchLeaves(
  //   @Args("query", { type: () => String }) query: string,
  //   @Args("page", { type: () => Int, nullable: true, defaultValue: 1 })
  //   page: number,
  //   @Args("limit", { type: () => Int, nullable: true, defaultValue: 10 })
  //   limit: number
  // ): Promise<LeavePaginatedResult> {
  //   try {
  //     return await this.leaveService.search(query, page, limit);
  //   } catch (error) {
  //     tconsumerow new GraphQLException(
  //       "Failed to search leaves",
  //       "INTERNAL_SERVER_ERROR"
  //     );
  //   }
  // }
}
