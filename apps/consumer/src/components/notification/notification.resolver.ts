// notification.resolver.ts

import { Inject, NotFoundException, UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Subscription, Args } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Notification } from '../entities/notification.entity';
import { NotificationService } from './notification.service';

const NOTIFICATION_ADDED_EVENT = 'notificationAdded';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(
    private readonly notificationService: NotificationService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => Notification)
  async createNotification(
    @Args('message') message: string,
    @Args('type') type: string,
    @Args('userId') userId: number,
  ): Promise<Notification> {
    const notification = await this.notificationService.create({
      message,
      type,
      userId,
    });

    await this.pubSub.publish(NOTIFICATION_ADDED_EVENT, {
      notificationAdded: notification,
    });

    return notification;
  }

  // ✅ Query to get notifications for a user
  @Query(() => [Notification])
  async notifications(
    @Args('user_id') userId: number,
  ): Promise<Notification[]> {
    return this.notificationService.findAllByUser(userId);
  }

  // ✅ Mutation: Mark a specific notification as read
  @Mutation(() => Notification)
  async markAsRead(@Args('id') id: number): Promise<Notification> {
    const notification = await this.notificationService.markAsRead(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  @Subscription(() => Notification, {
    filter: (payload, variables) =>
      payload.notificationAdded.userId === variables.userId,
  })
  notificationAdded(@Args('userId') userId: number) {
    return this.pubSub.asyncIterableIterator(NOTIFICATION_ADDED_EVENT);
  }
}
