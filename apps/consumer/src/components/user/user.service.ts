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
// import { JwtPayload } from './interfaces/jwtPayload.interface';

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

  async search(
    query?: string,
    page?: number,
    limit?: number,
    role?: ROLE_TYPE,
  ): Promise<UsersPaginatedResult> {
    const where: any = {};

    // Add role filter if provided
    if (role) {
      where.role = role;
    }

    // Add OR filters if query is present and not blank
    if (query && query.trim() !== '') {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Check if pagination should be applied
    const isPaginated = !!page && !!limit;

    if (!isPaginated) {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return new UsersPaginatedResult(users, 1, 1, total);
    }

    // Ensure valid pagination values
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
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
