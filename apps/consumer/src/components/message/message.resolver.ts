import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
// import { PubSub } from 'graphql-subscriptions';
import { MessageService } from './message.service';
import { Message } from '../entities/message.entity';
import { PubSub } from 'graphql-subscriptions'; // ✅ Interface

@Resolver(() => Message)
export class MessageResolver {
  constructor(
    private readonly messageService: MessageService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  // ✅ Send a new message
  @Mutation(() => Message)
  async sendMessage(
    @Args('content') content: string,
    @Args('senderId', { type: () => Int }) senderId: number,
    @Args('receiverId', { type: () => Int }) receiverId: number,
  ) {
    const message = await this.messageService.create({
      content,
      senderId,
      receiverId,
    });
    this.pubSub.publish('messageSent', { messageSent: message });
    return message;
  }

  // ✅ Fetch messages between two users
  @Query(() => [Message])
  getMessages(
    @Args('senderId', { type: () => Int }) senderId: number,
    @Args('receiverId', { type: () => Int }) receiverId: number,
  ) {
    return this.messageService.findMessagesBetween(senderId, receiverId);
  }

  // ✅ Get a single message by ID
  @Query(() => Message)
  getMessageById(@Args('id', { type: () => Int }) id: number) {
    return this.messageService.findOne(id);
  }

  // ✅ Update a message
  @Mutation(() => Message)
  updateMessage(
    @Args('id', { type: () => Int }) id: number,
    @Args('content') content: string,
  ) {
    return this.messageService.update(id, content);
  }

  // ✅ Delete a message
  @Mutation(() => Message)
  deleteMessage(@Args('id', { type: () => Int }) id: number) {
    return this.messageService.remove(id);
  }

  // ✅ Search messages with pagination
  @Query(() => [Message])
  async searchMessages(
    @Args('query') query: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    const result = await this.messageService.search(query, page, limit);
    return result.messages;
  }

  // ✅ Real-time subscription
  @Subscription(() => Message, {
    filter: (payload, variables) => {
      return (
        payload.messageSent.receiverId === variables.receiverId ||
        payload.messageSent.senderId === variables.receiverId
      );
    },
    resolve: (value) => value.messageSent,
  })
  messageSent(@Args('receiverId', { type: () => Int }) receiverId: number) {
    return this.pubSub.asyncIterableIterator('messageSent');
  }
}
