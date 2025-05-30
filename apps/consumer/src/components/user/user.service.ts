import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import {
  CreateUserInput,
  LoggedUserInput,
  UpdateUserInput,
  UsersPaginatedResult,
} from '../dto/user.input';
import { User } from '../entities/user.entity';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { sendMail } from '../../../../../utils/email.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaConsumerService,
    private readonly mailService: MailerService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(createUserInput.password, salt);

      const user = await this.prisma.user.create({
        data: {
          ...createUserInput,
          password: hashedPassword,
          isVerified: createUserInput.role === 'CUSTOMER' ? false : true,
        },
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

  async loggedUser(loggedUserInput: LoggedUserInput) {
    const { email, password } = loggedUserInput;

    const isEmailValid: User = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!isEmailValid) {
      throw new UnauthorizedException('Invalid username/password');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      isEmailValid.password,
    );

    if (isEmailValid.isVerified === false && isEmailValid.role === 'CUSTOMER') {
      throw new UnauthorizedException('Email is not verified.');
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password invalid.');
    }

    const payLoad: any = {
      id: isEmailValid.id,
      userType: isEmailValid.role,
    };
    const accessToken = await this.jwtService.sign(payLoad, {
      secret: this.configService.get('JWT_SECRET'),
    });

    return {
      id: isEmailValid.id,
      name: isEmailValid.firstName,
      token: accessToken,
      userType: isEmailValid.role,
    };
  }

  async verifiedUser(verifyCode: string, userId: number) {
    // Step 1: Find the verification record for the user
    const verification = await this.prisma.verification.findFirst({
      where: { userId },
      orderBy: {
        createdAt: 'desc', // latest first
      },
    });

    if (!verification) {
      throw new HttpException(
        'Verification record not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Step 2: Check if the provided code matches
    if (verification.code !== verifyCode) {
      throw new HttpException(
        'Invalid verification code.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Step 3: Optionally check for expiry
    if (verification.expiresAt < new Date()) {
      throw new HttpException(
        'Verification code has expired.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Step 4: Mark user as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    // Step 5: Optionally delete the verification record
    await this.prisma.verification.delete({
      where: { id: verification.id },
    });

    return {
      message: 'User successfully verified.',
    };
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

  async getPerformanceOverview(userId: number) {
    // Appointments Completed (Confirmed only)
    const totalAppointments = await this.prisma.appointment.count({
      where: {
        representativeId: userId,
        status: 'CONFIRMED',
      },
    });

    // Average response time (difference between appointment creation and confirmation)
    const avgResponse = await this.prisma.$queryRaw<
      Array<{ avg_minutes: number }>
    >`
    SELECT AVG(EXTRACT(EPOCH FROM (a."startTime" - a."createdAt")) / 60) as avg_minutes
    FROM "Appointment" a
    WHERE a."representativeId" = ${userId} AND a."status" = 'CONFIRMED'
  `;

    const averageResponseTime = Math.round(avgResponse?.[0]?.avg_minutes || 0);

    // Engagement score — you can define this yourself. Example: based on rating or chat volume
    const totalRating = await this.prisma.review.aggregate({
      where: { targetId: userId },
      _sum: { rating: true },
    });

    const engagementScore = Math.min(
      Math.round((totalRating._sum.rating ?? 0) * 2),
      100,
    ); // capped at 100

    // Compare vs last month
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const thisMonthCount = await this.prisma.appointment.count({
      where: {
        representativeId: userId,
        status: 'CONFIRMED',
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });

    const lastMonthCount = await this.prisma.appointment.count({
      where: {
        representativeId: userId,
        status: 'CONFIRMED',
        createdAt: {
          gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    });

    const growthRate = lastMonthCount
      ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
      : 100;

    return {
      appointmentsCompleted: totalAppointments,
      averageResponseTime: `${averageResponseTime} min`,
      engagementScore: `${engagementScore}%`,
      growthRate: `${growthRate >= 0 ? '+' : ''}${Math.round(growthRate)}%`,
    };
  }

  async getAnalytics(userId: number, range: 'week' | 'month') {
    const today = new Date();
    const from = new Date(today);
    if (range === 'week') from.setDate(today.getDate() - 7);
    else from.setMonth(today.getMonth() - 1);

    // Appointments grouped by day
    const appointments = await this.prisma.$queryRaw<
      Array<{ day: string; count: number }>
    >`
    SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as day, COUNT(*) as count
    FROM "Appointment"
    WHERE "representativeId" = ${userId} AND "createdAt" >= ${from}
    GROUP BY day ORDER BY day ASC
  `;

    // Chats grouped by day
    const messages = await this.prisma.$queryRaw<
      Array<{ day: string; count: number }>
    >`
    SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as day, COUNT(*) as count
    FROM "Message"
    WHERE "senderId" = ${userId} AND "createdAt" >= ${from}
    GROUP BY day ORDER BY day ASC
  `;

    return {
      appointments: appointments.map((item) => ({
        ...item,
        count: Number(item.count),
      })),
      chats: messages.map((item) => ({
        ...item,
        count: Number(item.count),
      })),
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const appointment = await this.prisma.appointment.findMany({
      where: {
        representativeId: user.id,
      },
    });

    const totalRating = await this.prisma.review.aggregate({
      where: {
        targetId: user.id,
      },
      _sum: {
        rating: true,
      },
    });

    const userId = user.id;

    // Get distinct chat partner IDs
    const sentTo = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedFrom = await this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const chatPartnerIds = new Set<number>();

    sentTo.forEach((msg) => chatPartnerIds.add(msg.receiverId));
    receivedFrom.forEach((msg) => chatPartnerIds.add(msg.senderId));

    const totalChats = chatPartnerIds.size;

    const performanceOverview = await this.getPerformanceOverview(user.id);
    const analytics = await this.getAnalytics(user.id, 'month');

    const userWithActivity: User = {
      ...user,
      activity: [
        {
          appointments: appointment.length,
          rating: totalRating._sum.rating ?? 0,
          chats: totalChats,
          performanceOverview: performanceOverview,
          analytics: analytics,
        },
      ],
    };

    return userWithActivity;
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    await this.findOne(id); // will throw if not found

    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
    });
  }

  async remove(id: number): Promise<User> {
    try {
      const isUserExist = await this.findOne(id);
      if (isUserExist) {
        await this.prisma.user.delete({
          where: {
            id,
          },
        });
        return isUserExist;
      } else {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }
    } catch (e) {
      throw new HttpException(`Error Deleting User  : ${e}`, 500);
    }
  }

  // async search(
  //   query?: string,
  //   page?: number,
  //   limit?: number,
  //   role?: ROLE_TYPE,
  // ): Promise<UsersPaginatedResult> {
  //   const where: any = {};

  //   // Add role filter if provided
  //   if (role) {
  //     where.role = role;
  //   }

  //   // Add OR filters if query is present and not blank
  //   if (query && query.trim() !== '') {
  //     where.OR = [
  //       { firstName: { contains: query, mode: 'insensitive' } },
  //       { email: { contains: query, mode: 'insensitive' } },
  //     ];
  //   }

  //   // Check if pagination should be applied
  //   const isPaginated = !!page && !!limit;

  //   if (!isPaginated) {
  //     const [users, total] = await this.prisma.$transaction([
  //       this.prisma.user.findMany({
  //         where,
  //         orderBy: { createdAt: 'desc' },
  //       }),
  //       this.prisma.user.count({ where }),
  //     ]);

  //     return new UsersPaginatedResult(users, 1, 1, total);
  //   }

  //   // Ensure valid pagination values
  //   if (page < 1) page = 1;
  //   if (limit < 1) limit = 10;
  //   const skip = (page - 1) * limit;

  //   const [users, total] = await this.prisma.$transaction([
  //     this.prisma.user.findMany({
  //       where,
  //       skip,
  //       take: limit,
  //       orderBy: { createdAt: 'desc' },
  //     }),
  //     this.prisma.user.count({ where }),
  //   ]);

  //   return new UsersPaginatedResult(
  //     users,
  //     Math.ceil(total / limit),
  //     page,
  //     total,
  //   );
  // }

  async search(
    query?: string,
    page?: number,
    limit?: number,
    role?: ROLE_TYPE,
    location?: string,
    product?: string,
    minReviewCount?: number,
    maxReviewCount?: number,
    minRating?: number,
  ): Promise<UsersPaginatedResult> {
    const where: any = {};

    if (role) where.role = role;

    if (query?.trim()) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { storeName: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (location?.trim()) {
      where.storeAddress = { contains: location, mode: 'insensitive' };
    }

    if (product?.trim()) {
      where.products = { contains: product, mode: 'insensitive' };
    }

    if (
      (minReviewCount !== undefined && minReviewCount !== null) ||
      (maxReviewCount !== null && maxReviewCount !== undefined) ||
      (minRating !== null && minRating !== undefined)
    ) {
      where.reviewsReceived = {
        some: {
          ...(minRating && {
            rating: { gte: minRating },
          }),
        },
      };
    }

    const isPaginated = !!page && !!limit;
    if (!isPaginated) {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          include: {
            reviewsReceived: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return new UsersPaginatedResult(users, 1, 1, total);
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          reviewsReceived: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new UsersPaginatedResult(
      users,
      Math.ceil(total / limit),
      page,
      total,
    );
  }
}
