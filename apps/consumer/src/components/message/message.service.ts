import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaConsumerService) {}

  async create(data: {
    content: string;
    senderId: number;
    receiverId: number;
  }): Promise<Message> {
    try {
      return await this.prisma.message.create({ data });
    } catch (error) {
      console.log('error', error);

      throw new InternalServerErrorException('Failed to send message');
    }
  }

  async findMessagesBetween(
    senderId: number,
    receiverId: number,
  ): Promise<Message[]> {
    try {
      return await this.prisma.message.findMany({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async findOne(id: number): Promise<Message> {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async update(id: number, content: string): Promise<Message> {
    await this.findOne(id); // Validate message exists

    try {
      return await this.prisma.message.update({
        where: { id },
        data: { content },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update message');
    }
  }

  async remove(id: number): Promise<Message> {
    const message = await this.findOne(id);
    try {
      await this.prisma.message.delete({ where: { id } });
      return message;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete message');
    }
  }

  async search(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<{
    messages: Message[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    try {
      const [messages, total] = await this.prisma.$transaction([
        this.prisma.message.findMany({
          where: {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.message.count({
          where: {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
        }),
      ]);

      return {
        messages,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to search messages');
    }
  }
}
