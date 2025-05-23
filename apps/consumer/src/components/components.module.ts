import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HolidayResolver } from './holiday/hoiday.resolver';
import { HolidayService } from './holiday/holiday.service';
import { DesignationResolver } from './designation/designation.resolver';
import { DesignationService } from './designation/designation.service';
import { LeaveResolver } from './leave/leave.resolver';
import { LeaveService } from './leave/leave.service';
import { DeductionContributionResolver } from './deductionContribution/deductionContribution.resolver';
import { DeductionContributionService } from './deductionContribution/deductionContribution.service';
import { LeaveTypeResolver } from './leaveType/leaveType.resolver';
import { LeaveTypeService } from './leaveType/leaveType.service';
import { ProfileResolver } from './profile/profile.resolver';
import { ProfileService } from './profile/profile.service';
import { ShiftService } from './shift/shift.service';
import { ShiftResolver } from './shift/shift.resolver';
import { LeaveEncashmentResolver } from './leaveEncashment/leaveEncashment.resolver';
import { LeaveEncashmentService } from './leaveEncashment/leaveEncashment.service';
import { PayScheduleResolver } from './paySchedule/paySchedule.resolver';
import { PayScheduleService } from './paySchedule/paySchedule.service';
import { ProfileDetailsResolver } from './profileDetails/profileDetails.resolver';
import { ProfileDetailsService } from './profileDetails/profileDetails.service';
import { DocumentationResolver } from './documentaion/documentation.resolver';
import { DocumentationService } from './documentaion/documentation.service';
import { GeneralSettingsResolver } from './generalSettings/generalSettings.resolver';
import { GeneralSettingsService } from './generalSettings/generalSettings.service';
import { TimeSheetResolver } from './timesheet/timesheet.resolver';
import { TimeSheetService } from './timesheet/timesheet.service';
import { PayrollTaxResolver } from './payrollTax/payroll-tax.resolver';
import { PayrollTaxService } from './payrollTax/payroll-tax.service';
import { PayrollTaxCalculationService } from './payrollTax/payrollTaxCalculation.service';

import { LeaveBalanceResolver } from './leaveBalance/leaveBalance.resolver';
import { LeaveBalanceService } from './leaveBalance/leaveBalance.service';

import { LeaveBalanceDetailsResolver } from './leaveBalanceDetails/leaveBalanceDetails.resolver';
import { LeaveBalanceDetailsService } from './leaveBalanceDetails/leaveBalanceDetails.service';
import { TimeSheetProcessResolver } from './timeSheetProcess/timeSheetProcess.resolver';
import { TimeSheetProcessService } from './timeSheetProcess/timeSheetProcess.service';
import { EmployeePayrollProcessResolver } from './selaryProcess/selaryProcess.resolver';
import { EmployeePayrollService } from './selaryProcess/selaryProcess.service';
import { PunchDataService } from './punchData/punchData.service';
import { PunchDataResolver } from './punchData/punchData.resolver';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: 3600,
        },
      }),
    }),
  ],
  providers: [
    JwtService,
    ConfigService,
    HolidayResolver,
    HolidayService,
    DesignationResolver,
    DesignationService,
    LeaveResolver,
    LeaveService,
    DeductionContributionResolver,
    DeductionContributionService,
    LeaveTypeResolver,
    LeaveTypeService,
    ProfileResolver,
    ProfileService,
    ShiftService,
    ShiftResolver,
    LeaveEncashmentResolver,
    LeaveEncashmentService,
    PayScheduleResolver,
    PayScheduleService,
    ProfileDetailsResolver,
    ProfileDetailsService,
    DocumentationResolver,
    DocumentationService,
    GeneralSettingsResolver,
    GeneralSettingsService,
    TimeSheetResolver,
    TimeSheetService,
    PayrollTaxResolver,
    PayrollTaxService,
    PayrollTaxCalculationService,
    LeaveBalanceResolver,
    LeaveBalanceService,
    LeaveBalanceDetailsResolver,
    LeaveBalanceDetailsService,
    TimeSheetProcessResolver,
    TimeSheetProcessService,
    EmployeePayrollProcessResolver,
    EmployeePayrollService,
    PunchDataResolver,
    PunchDataService,
  ],
})
export class ComponentsModule {}
