import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaconsumerService } from "../../../../../prisma/prisma-consumer.service"; // Adjust the import path for your Prisma service
import {
  CreatePayScheduleInput,
  UpdatePayScheduleInput,
  PaySchedulePaginatedResult,
} from "../dto/paySchedule.input";
import { PaySchedule } from "../entities/paySchedule.entity";

@Injectable()
export class PayScheduleService {
  constructor(private readonly prisma: PrismaconsumerService) {}

  // Create a new pay schedule
  async create(
    createPayScheduleInput: CreatePayScheduleInput
  ): Promise<PaySchedule> {
    return this.prisma.paySchedule.create({
      data: createPayScheduleInput,
    });
  }

  // Get a paginated list of pay schedules
  async findAll(page = 1, limit = 10): Promise<PaySchedulePaginatedResult> {
    const skip = (page - 1) * limit;

    const [paySchedules, totalCount] = await Promise.all([
      this.prisma.paySchedule.findMany({
        skip,
        take: limit,
      }) || [], // Ensure it's always an array
      this.prisma.paySchedule.count(),
    ]);

    return {
      paySchedules: Array.isArray(paySchedules) ? paySchedules : [], // Safety check
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
    };
  }

  // Get a pay schedule by its ID
  async findOne(id: number): Promise<PaySchedule> {
    const paySchedule = await this.prisma.paySchedule.findUnique({
      where: { id },
    });
    if (!paySchedule) {
      tconsumerow new NotFoundException(`Pay schedule with ID ${id} not found`);
    }
    return paySchedule;
  }

  // Update an existing pay schedule
  async update(
    id: number,
    updatePayScheduleInput: UpdatePayScheduleInput
  ): Promise<PaySchedule> {
    await this.findOne(id);
    return this.prisma.paySchedule.update({
      where: { id },
      data: updatePayScheduleInput,
    });
  }

  // Remove a pay schedule by its ID
  async remove(id: number): Promise<PaySchedule> {
    await this.findOne(id);
    return this.prisma.paySchedule.delete({
      where: { id },
    });
  }

  // Search pay schedules based on query (e.g., by schedule name or date)
  async search(
    query: string,
    page = 1,
    limit = 10
  ): Promise<PaySchedulePaginatedResult> {
    const skip = (page - 1) * limit;

    const [paySchedules, totalCount] = await Promise.all([
      this.prisma.paySchedule.findMany({
        where: {
          payScheduleName: { contains: query, mode: "insensitive" }, // Case-insensitive search
        },
        skip,
        take: limit,
      }),
      this.prisma.paySchedule.count({
        where: {
          payScheduleName: { contains: query, mode: "insensitive" },
        },
      }),
    ]);

    return {
      paySchedules, // Ensure it matches PaySchedule type
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }
}
