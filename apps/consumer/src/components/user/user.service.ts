import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import {
  CreateUserInput,
  UpdateUserInput,
  UsersPaginatedResult,
} from '../dto/user.input';
import { User } from '../entities/user.entity';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

import { MailerService } from '@nestjs-modules/mailer';
import { sendMail } from '../../../../../utils/email.util';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaConsumerService,
    private readonly mailService: MailerService,
  ) {}

  async generateAndSendCode(user: User): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code
    await this.prisma.verification.create({
      data: {
        email: user.email,
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send email
    const subject = 'Complete Your Onboarding';
    const body = `
      <h1>Welcome, ${user.firstName}!</h1>
      <p>Use this code to complete your onboarding:</p>
      <h2>${code}</h2>
    `;
    sendMail(user.email, subject, body, this.mailService);
  }

  async create(createUserInput: CreateUserInput): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserInput.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists.');
      }

      const user = await this.prisma.user.create({
        data: { ...createUserInput },
      });

      if (user.role === 'CUSTOMER') {
        await this.generateAndSendCode(user);
      }

      return user;
    } catch (error) {
      // Log error if needed here or use a logger service
      throw new InternalServerErrorException(
        'Failed to create user: ' + error.message,
      );
    }
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
    page = 1,
    limit = 10,
  ): Promise<UsersPaginatedResult> {
    // Ensure valid pagination values
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Base filters: case-insensitive partial match on firstName and email
    const orFilters: any[] = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ];

    // Add role filter if query exactly matches one of the ROLE_TYPE enum values
    const upperQuery = query.toUpperCase();
    if (Object.values(ROLE_TYPE).includes(upperQuery as ROLE_TYPE)) {
      orFilters.push({ role: upperQuery as ROLE_TYPE });
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { OR: orFilters },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { OR: orFilters },
      }),
    ]);

    return new UsersPaginatedResult(
      users,
      Math.ceil(total / limit),
      page,
      total,
    );
  }
}
