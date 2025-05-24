import {
  InputType,
  Field,
  Int,
  PartialType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsDate,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
} from 'class-validator';

import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../../prisma/OnboardingType.enum';

@InputType()
export class CreateAppointmentInput {
  @Field()
  @IsNotEmpty()
  @IsDate()
  date: Date;

  @Field()
  @IsNotEmpty()
  @IsDate()
  startTime: Date;

  @Field()
  @IsNotEmpty()
  @IsDate()
  endTime: Date;

  @Field()
  @IsNotEmpty()
  @IsInt()
  customerId: number;

  @Field()
  @IsNotEmpty()
  @IsInt()
  representativeId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;

  @Field(() => AppointmentStatus, {
    defaultValue: AppointmentStatus.PENDING,
  })
  status: keyof typeof AppointmentStatus;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  chatRequested?: boolean;
}

@InputType()
export class UpdateAppointmentInput extends PartialType(
  CreateAppointmentInput,
) {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  id: number;
}

@ObjectType()
export class AppointmentPaginatedResult {
  @Field(() => [Appointment], { defaultValue: [] })
  appointments: Appointment[] = [];

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalCount: number;

  constructor(
    appointments: Appointment[],
    totalPages: number,
    currentPage: number,
    totalCount: number,
  ) {
    this.appointments = appointments ?? [];
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.totalCount = totalCount;
  }
}
