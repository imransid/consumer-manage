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

  async generateAndSendResetLink(user: User, callBackUrl: string) {
    const subject = 'Reset Your Password';
    const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f4f4; border-radius: 8px;">
      <h2 style="color: #333;">Hello, ${user.firstName}!</h2>
      <p style="font-size: 16px; color: #555;">
        We received a request to reset your password. Click the button below to change your password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${callBackUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;">
          Change Password
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  `;

    try {
      await sendMail(user.email, subject, body, this.mailService);
      return {
        message: 'Password reset email sent successfully.',
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send password reset email.');
    }
  }

  async requestPasswordReset(email: string, callBackUrl: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    try {
      return this.generateAndSendResetLink(user, callBackUrl);
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
