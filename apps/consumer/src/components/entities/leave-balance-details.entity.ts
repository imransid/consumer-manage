import { ObjectType, Field, Int } from "@nestjs/graphql";
import { LeaveBalance } from "./leaveBalance.entity";

@ObjectType()
export class LeaveBalanceDetails {
  @Field(() => Int)
  id: number;

  @Field(() => Int, { nullable: true })
  createdBy?: number;

  @Field(() => Int, { nullable: true })
  companyId?: number;

  @Field(() => String, { nullable: true })
  leaveBalances?: string; // Holds EMPCode, EMPName, and leave type values

  @Field(() => Int, { nullable: true })
  leaveBalanceId?: number;

  @Field(() => LeaveBalance, { nullable: true })
  leaveBalance?: LeaveBalance;
}

@ObjectType()
export class AllUPDATEDLeaveBalanceDetailsResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => [LeaveBalanceDetails])
  data: LeaveBalanceDetails[];
}
@ObjectType()
export class LeaveBalanceSummary {
  @Field()
  message: string;

  @Field(() => [LeaveTypeTotal])
  data: LeaveTypeTotal[];
}

@ObjectType()
export class LeaveTypeTotal {
  @Field()
  type: string;

  @Field(() => Int)
  total: number;
}
