import {
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

  async create(createUserInput: CreateUserInput): Promise<User> {
    try {
      const data = {
        ...createUserInput,
      };

      const createdUser: User = await this.prisma.user.create({
        data,
      });

      if (createUserInput.role === 'CUSTOMER') {
        const body = `
  <h1 style="font-size: 24px; color: #333;">Welcome !</h1>
    Complete Onboarding
  </a>
`;

        const subject = 'role';
        sendMail(createUserInput.email, subject, body, this.mailService);
      }

      return createdUser;
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
