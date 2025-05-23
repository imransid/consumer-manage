import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import {
  CreateUserInput,
  UpdateUserInput,
  UsersPaginatedResult,
} from '../dto/user.input';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaConsumerService) {}

  async create(createUserInput: CreateUserInput) {
    return this.prisma.user.create({
      data: createUserInput,
    });
  }

  async findAll(page: number, limit: number): Promise<UsersPaginatedResult> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    await this.findOne(id); // will throw if not found

    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // will throw if not found

    return this.prisma.user.delete({ where: { id } });
  }

  async search(
    query: string,
    page: number,
    limit: number,
  ): Promise<UsersPaginatedResult> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { role: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { role: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      users,
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
