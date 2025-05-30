import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { PrismaConsumerService } from '../../../../../prisma/prisma-hr.service';
import {
  AppointmentPaginatedResult,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../dto/appointments.input';
import { Appointment } from '../entities/appointment.entity';
import { NotificationService } from '../notification/notification.service';
import { PubSub } from 'graphql-subscriptions';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaConsumerService,
    private readonly notificationService: NotificationService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  // private pubSub = new PubSub();
  // Create appointment
  async create(
    createAppointmentInput: CreateAppointmentInput,
  ): Promise<Appointment> {
    try {
      const appointment = await this.prisma.appointment.create({
        data: createAppointmentInput,
      });

      // 🔔 Trigger notification after creation
      const createdNotification = await this.notificationService.create({
        message: `Your appointment is confirmed for ${createAppointmentInput.date.toLocaleTimeString()}`,
        type: 'Appointment',
        userId: createAppointmentInput.representativeId,
      });

      // Publish notification event
      this.pubSub.publish('notificationAdded', {
        notificationAdded: createdNotification,
      });

      return appointment;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create appointment: ' + error.message,
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    userId?: number,
    role?: ROLE_TYPE,
  ): Promise<AppointmentPaginatedResult> {
    try {
      const skip = (page - 1) * limit;

      // Build `where` condition based on userId and role
      let where: any = {};
      if (userId && role === ROLE_TYPE.CUSTOMER) {
        where.customerId = userId;
      } else if (userId && role === ROLE_TYPE.REPRESENTATIVE) {
        where.representativeId = userId;
      }

      const [appointments, totalCount] = await this.prisma.$transaction([
        this.prisma.appointment.findMany({
          skip,
          take: limit,
          orderBy: { date: 'asc' },
          where,
          include: {
            representative: true,
            customer: true,
          },
        }),
        this.prisma.appointment.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        appointments,
        totalCount,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch appointments: ' + error.message,
      );
    }
  }

  // async findAll(
  //   page = 1,
  //   limit = 10,
  //   userId: number,
  // ): Promise<AppointmentPaginatedResult> {
  //   try {
  //     const skip = (page - 1) * limit;
  //     const [appointments, totalCount] = await this.prisma.$transaction([
  //       this.prisma.appointment.findMany({
  //         skip,
  //         take: limit,
  //         orderBy: { date: 'asc' },
  //         include: {
  //           representative: true,
  //           customer: true,
  //         },
  //         where : {
  //           customerId
  //         }
  //       }),
  //       this.prisma.appointment.count(),
  //     ]);

  //     const totalPages = Math.ceil(totalCount / limit);

  //     return {
  //       appointments,
  //       totalCount,
  //       totalPages,
  //       currentPage: page,
  //     };
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       'Failed to fetch appointments: ' + error.message,
  //     );
  //   }
  // }
  // Find one by id
  async findOne(id: number): Promise<Appointment> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          representative: true,
        },
      });
      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }
      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch appointment: ' + error.message,
      );
    }
  }

  // Update appointment
  async update(
    id: number,
    updateAppointmentInput: UpdateAppointmentInput,
  ): Promise<Appointment> {
    try {
      await this.findOne(id); // check existence
      return await this.prisma.appointment.update({
        where: { id },
        data: updateAppointmentInput,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to update appointment: ' + error.message,
      );
    }
  }

  // Remove appointment
  async remove(id: number): Promise<Appointment> {
    try {
      await this.findOne(id); // check existence
      return await this.prisma.appointment.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to remove appointment: ' + error.message,
      );
    }
  }

  // Search appointments with pagination (searching by title or description)
  async search(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<AppointmentPaginatedResult> {
    try {
      const skip = (page - 1) * limit;

      const [appointments, totalCount] = await this.prisma.$transaction([
        this.prisma.appointment.findMany({
          where: {
            OR: [
              { note: { contains: query, mode: 'insensitive' } },
              // { date: { contains: query, mode: 'insensitive' } },
            ],
          },
          skip,
          take: limit,
          orderBy: { date: 'asc' },
        }),
        this.prisma.appointment.count({
          where: {
            OR: [
              { note: { contains: query, mode: 'insensitive' } },
              // { description: { contains: query, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        appointments,
        totalCount,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to search appointments: ' + error.message,
      );
    }
  }
}
