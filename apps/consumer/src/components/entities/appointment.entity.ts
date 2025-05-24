import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity'; // Update this path as needed
import { AppointmentStatus } from '../../prisma/OnboardingType.enum';

@ObjectType()
export class Appointment {
  @Field(() => Int)
  id: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Appointment scheduling
  @Field()
  date: Date;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  // Optional note
  @Field({ nullable: true })
  note?: string;

  @Field(() => AppointmentStatus, {
    defaultValue: AppointmentStatus.PENDING,
  })
  status: keyof typeof AppointmentStatus;

  // Chat request
  @Field()
  chatRequested: boolean;

  // Associations
  @Field(() => Int)
  customerId: number;

  @Field(() => Int)
  representativeId: number;

  @Field(() => User)
  customer?: User;

  @Field(() => User)
  representative?: User;
}
