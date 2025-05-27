// notification.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import { CreateNotificationInput } from '../dto/notification.input';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaConsumerService) {}

  async create(data: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async findAllByUser(userId: number): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async delete(id: number): Promise<Notification> {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
