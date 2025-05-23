import {
  InputType,
  Field,
  Int,
  ObjectType,
  PartialType,
} from "@nestjs/graphql";
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsDateString,
  IsDate,
} from "class-validator";
import { PaySchedule } from "../entities/paySchedule.entity";
import { FrequencyType } from "../../prisma/OnboardingType.enum";

@InputType()
export class CreatePayScheduleInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  payScheduleName: string;

  @Field(() => FrequencyType, {
    defaultValue: FrequencyType.EVERY_MONTH,
  }) // Change to use the enum
  @IsNotEmpty()
  payFrequency: keyof typeof FrequencyType;

  @Field()
  @IsNotEmpty()
  @IsBoolean()
  isDefaultForNewEmployees: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  nextPayDay?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  endOfNextPayPeriod?: Date;

  // Monthly Pay Fields
  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  firstPayPeriodOfTheMonth?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  companyID?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  paydayOfTheMonth?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endOfEachMonthPayPeriodTimeLine?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endOfEachMonthPayDay?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  daysBeforePayday?: string;

  // Twice a Month Pay Fields
  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  secondPayPeriodOfTheMonth?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  secondPaydayOfTheMonth?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  secondEndOfEachMonthPayPeriodTimeLine?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  secondEndOfEachMonthPayDay?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  secondDaysBeforePayday?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  monthType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  createdBy?: number;
}

@InputType()
export class UpdatePayScheduleInput extends PartialType(
  CreatePayScheduleInput
) {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  id: number;
}

@ObjectType()
export class PaySchedulePaginatedResult {
  @Field(() => [PaySchedule], { defaultValue: [] })
  paySchedules: PaySchedule[] = [];

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalCount: number;

  constructor(
    paySchedules: PaySchedule[],
    totalPages: number,
    currentPage: number,
    totalCount: number
  ) {
    this.paySchedules = paySchedules ?? [];
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.totalCount = totalCount;
  }
}
