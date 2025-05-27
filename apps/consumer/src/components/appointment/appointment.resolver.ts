import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentPaginatedResult,
} from '../dto/appointments.input';
import { Appointment } from '../entities/appointment.entity';
import { NotFoundException } from '@nestjs/common';
import { GraphQLException } from 'exceptions/graphql-exception';
import { ROLE_TYPE } from '../../prisma/OnboardingType.enum';

@Resolver(() => Appointment)
export class AppointmentResolver {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Mutation(() => Appointment)
  async createAppointment(
    @Args('createAppointmentInput')
    createAppointmentInput: CreateAppointmentInput,
  ): Promise<Appointment> {
    try {
      return await this.appointmentService.create(createAppointmentInput);
    } catch (error) {
      throw new GraphQLException(
        'Failed to create appointment: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => AppointmentPaginatedResult)
  async appointments(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('role', { type: () => ROLE_TYPE, nullable: true }) role?: ROLE_TYPE,
  ): Promise<AppointmentPaginatedResult> {
    try {
      return await this.appointmentService.findAll(page, limit, userId, role);
    } catch (error) {
      throw new GraphQLException(
        'Failed to fetch appointments: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => Appointment)
  async appointment(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Appointment> {
    try {
      return await this.appointmentService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(
          `Appointment with ID ${id} not found`,
          'NOT_FOUND',
        );
      }
      throw new GraphQLException(
        'Failed to fetch appointment: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => Appointment)
  async updateAppointment(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateAppointmentInput')
    updateAppointmentInput: UpdateAppointmentInput,
  ): Promise<Appointment> {
    try {
      return await this.appointmentService.update(id, updateAppointmentInput);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(
          `Appointment with ID ${id} not found`,
          'NOT_FOUND',
        );
      }
      throw new GraphQLException(
        'Failed to update appointment: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => Appointment)
  async removeAppointment(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Appointment> {
    try {
      return await this.appointmentService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new GraphQLException(
          `Appointment with ID ${id} not found`,
          'NOT_FOUND',
        );
      }
      throw new GraphQLException(
        'Failed to remove appointment: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => AppointmentPaginatedResult)
  async searchAppointments(
    @Args('query', { type: () => String }) query: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
  ): Promise<AppointmentPaginatedResult> {
    try {
      return await this.appointmentService.search(query, page, limit);
    } catch (error) {
      throw new GraphQLException(
        'Failed to search appointments: ' + error.toString(),
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
