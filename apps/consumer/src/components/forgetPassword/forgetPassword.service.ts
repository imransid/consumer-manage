import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../entities/user.entity';
import { sendMail } from '../../../../../utils/email.util';

@Injectable()
export class ForgotPasswordService {
  constructor(
    private readonly prisma: PrismaConsumerService,
    private readonly mailService: MailerService,
  ) {}

  async generateAndSendCode(user: User) {
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

    const subject = 'Reset Your Password Code';
    const body = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f4f4; border-radius: 8px;">
    <h2 style="color: #333;">Hello, ${user.firstName}!</h2>
    <p style="font-size: 16px; color: #555;">
      We received a request to reset your password. Use the verification code below to complete the process:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 15px 30px; background-color: #007bff; color: white; font-size: 24px; font-weight: bold; border-radius: 6px; letter-spacing: 3px;">
        ${code}
      </div>
    </div>
    <p style="font-size: 14px; color: #777;">
      This code will expire in 15 minutes. If you didn’t request a password reset, you can ignore this email.
    </p>
  </div>
`;

    sendMail(user.email, subject, body, this.mailService);

    return {
      message: 'email send successfully.',
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    try {
      return this.generateAndSendCode(user);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create reset token or send email',
      );
    }
  }

  async resetPassword(userId: number, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'reset successfully.',
    };
  }
}
