import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaconsumerService } from "../../../../../prisma/prisma-consumer.service";
import { EmployeePayrollProcess } from "../entities/employeePayroll.entity";
import { PayrollTaxService } from "../payrollTax/payroll-tax.service";
import { FilingStatus } from "../../prisma/OnboardingType.enum";
import { NetPaySummary } from "../entities/taxRate.entity";
import { PaySchedule, profileDetails, timeSheet } from "prisma/generated/consumer";

import { calculatePayrollFieldsHelper } from "./helpers/calculate-payroll-fields.helper";
import {
  CreateEmployeePayrollInput,
  EmployeePayrollPaginatedResult,
  UpdateEmployeePayrollInput,
} from "../dto/create-employee-payroll.input";
import { EmployeePayroll } from "../entities/employee-payroll.entity";
import { netPayHelper } from "./helpers/payrollTax-helper";

@Injectable()
export class EmployeePayrollService {
  constructor(
    private readonly prisma: PrismaconsumerService,
    private readonly payrollTaxService: PayrollTaxService
  ) {}

  async getAllEmployeePayroll(
    payScheduleId: number
  ): Promise<EmployeePayrollProcess[]> {
    const paySchedule = await this.prisma.paySchedule.findUnique({
      where: { id: payScheduleId },
    });

    if (!paySchedule) {
      tconsumerow new Error("PaySchedule not found");
    }

    const allProfile = await this.prisma.profile.findMany({
      where: {
        profileDetails: {
          payScheduleID: payScheduleId,
        },
      },
      include: {
        profileDetails: {
          include: {
            paySchedule: true,
          },
        },
        timeSheetProcesses: true,
      },
    });

    if (!allProfile || allProfile.length === 0) {
      tconsumerow new Error("No profiles found for this PaySchedule ID");
    }

    const payrollList = await Promise.all(
      allProfile.map(async (profile, index) => {
        const details = profile.profileDetails;
        const timeSheet = profile.timeSheetProcesses;

        const {
          rate,
          salary,
          OT,
          doubleOT,
          bonus,
          workingHours,
          grossPay,
          currentProfileHourlySalary,
        } = this.calculatePayrollFields(
          details,
          timeSheet,
          details.paySchedule
        );

        let employeeDeduction = 0;
        let employeeContribution = 0;

        const strArray: string[] =
          profile.profileDetails.deduction_Contribution;

        let parsedArray = [];

        try {
          // Replace single quotes around keys and values
          const validJsonStr = strArray[0]
            .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":') // keys
            .replace(/:\s*'([^']+?)'(?=[,}])/g, ': "$1"'); // values

          // Parse the fixed JSON string
          const parsed = JSON.parse(validJsonStr);

          // If it's an array, spread into parsedArray
          if (Array.isArray(parsed)) {
            parsedArray.push(...parsed);
          } else {
            parsedArray.push(parsed);
          }
        } catch (e) {
          console.error("Failed to parse deduction_Contribution:", e.message);
        }

        if (parsedArray.length > 0) {
          const totalCompanyAnnualMax = parsedArray.reduce((sum, item) => {
            return sum + Number(item.compnay_annual_max);
          }, 0);

          const totalEmployeeAnnualMax = parsedArray.reduce((sum, item) => {
            return sum + Number(item.employee_annual_max);
          }, 0);

          employeeContribution = totalCompanyAnnualMax;
          employeeDeduction = totalEmployeeAnnualMax;
        }

        const { totalPay } = this.calculateEmployeeSalary(
          currentProfileHourlySalary,
          workingHours,
          details.paySchedule,
          details
        );

        const yearlySealery = parseFloat(rate) * 8 * 5 * 52;

        const netPaySummary = await this.netPaySummaryCalculation(
          yearlySealery,
          workingHours
        );

        this.netPayDetails(
          grossPay,
          details.paySchedule,
          details,
          rate,
          workingHours
        );

        const netPay = await this.netPayCalculation(
          //total need to pay
          totalPay,
          details.maritalStatus,
          employeeDeduction
        );

        return {
          id: index + 1,
          employeeName:
            `${profile.employeeName} ${profile.middleName || ""} ${profile.lastName || ""}`.trim(),
          workingconsumers: `${workingHours}`,
          Rate: rate,
          Salary: salary.toString(), //salary.toFixed(2),
          OT: "0",
          doubleOT: "0",
          PTO: "0", // Placeholder
          holydayPay: "0", // Placeholder
          bonus: "0",
          commission: "0", // Placeholder
          total: workingHours.toString(),
          grossPay: grossPay.toFixed(2).toString(),
          profile: profile as any,
          paySchedule: paySchedule as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          employeeContribution,
          employeeDeduction,
          netPaySummary: netPaySummary,
          netPay: netPay,
          profileID: profile.id,
        };
      })
    );

    return payrollList;
  }

  private async netPaySummaryCalculation(
    amount: number,
    hours: number
  ): Promise<NetPaySummary> {
    let employeeDta = await this.payrollTaxService.taxRate(
      amount,
      FilingStatus.SINGLE
    );

    let employerDta = await this.payrollTaxService.taxRateEmployer(amount);

    employeeDta.federalTaxWithHoldingHourlyRate =
      employeeDta.federalTaxWithHoldingHourlyRate * hours;

    return {
      employeeDta,
      employerDta,
    };
  }

  private async netPayCalculation(
    amount: number,
    filingStatus: string,
    deductions: number
  ) {
    let employeeDta = await this.payrollTaxService.taxRate(
      amount,
      filingStatus === "Married" ? FilingStatus.MARRIED : FilingStatus.SINGLE
    );

    const employeeTotalTax =
      employeeDta.federalTaxWithHoldingYearly +
      employeeDta.medicareTax +
      employeeDta.socialSecurityTax;

    const totalNetPay = employeeTotalTax + deductions;

    return totalNetPay;
  }

  private calculatePayrollFields(
    details: profileDetails,
    timeSheet: any,
    paySchedule: any
  ): {
    rate: string;
    salary: string;
    OT: string;
    doubleOT: string;
    bonus: string;
    workingHours: number;
    grossPay: number;
    currentProfileHourlySalary: number;
  } {
    return calculatePayrollFieldsHelper(details, timeSheet, paySchedule);
  }

  private calculateEmployeeSalary(
    hourlyRate: number,
    employeeTotalWorkingHour: number,
    paySchedule: PaySchedule,
    details: profileDetails
  ) {
    const WORKING_HOURS_PER_DAY = 8;
    const OVERTIME_MULTIPLIER = 1.5;

    let workingDays: number;

    switch (paySchedule.payFrequency) {
      case "EVERY_WEEK":
      case "EVERY_ONCE_WEEK":
        workingDays = 5; // Monday to Friday
        break;
      case "TWICE_A_MONTH":
        workingDays = 10; // Roughly 2 working weeks
        break;
      case "EVERY_MONTH":
        workingDays = 22; // Average monthly working days
        break;
      default:
        tconsumerow new Error("Unsupported pay frequency");
    }

    const regularHours = workingDays * WORKING_HOURS_PER_DAY;
    const isOvertimeAllowed = details.overTime === true;

    const overtimeHours = isOvertimeAllowed
      ? Math.max(0, employeeTotalWorkingHour - regularHours)
      : 0;

    const regularWorkedHours = employeeTotalWorkingHour - overtimeHours;
    const regularSalary = regularWorkedHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
    const totalPay = regularSalary + overtimePay;

    return {
      regularHours,
      regularWorkedHours,
      overtimeHours,
      regularSalary,
      overtimePay,
      totalPay,
    };
  }

  // service

  async create(input: CreateEmployeePayrollInput): Promise<EmployeePayroll> {
    const { netPaySummary, profileId, ...rest } = input;

    return this.prisma.employeePayroll.create({
      data: {
        ...rest,
        profile: profileId ? { connect: { id: profileId } } : undefined,
        netPaySummary: input.netPaySummary,
      },
    });
  }

  async findAll(page = 1, limit = 10): Promise<EmployeePayrollPaginatedResult> {
    const skip = (page - 1) * limit;

    const [employeePayrolls, totalCount] = await Promise.all([
      this.prisma.employeePayroll.findMany({
        skip,
        take: limit,
        orderBy: {
          id: "desc",
        },
      }),
      this.prisma.employeePayroll.count(),
    ]);

    // Map the result to match the GraphQL object shape
    const payrolls = employeePayrolls.map((payroll) => {
      return {
        id: payroll.id,
        employeeName: payroll.employeeName,
        workingconsumers: payroll.workingconsumers,
        rate: payroll.rate,
        salary: payroll.salary,
        OT: payroll.OT,
        doubleOT: payroll.doubleOT,
        PTO: payroll.PTO,
        holidayPay: payroll.holidayPay,
        bonus: payroll.bonus,
        commission: payroll.commission,
        total: payroll.total,
        grossPay: payroll.grossPay,
        netPay: payroll.netPay,
        employeeContribution: payroll.employeeContribution,
        employeeDeduction: payroll.employeeDeduction,
        netPaySummary: payroll.netPaySummary ? payroll.netPaySummary : null,
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt,
      };
    });

    return {
      payrolls,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

  async findOne(id: number): Promise<EmployeePayroll> {
    const payroll = await this.prisma.employeePayroll.findUnique({
      where: { id },
    });

    if (!payroll) {
      tconsumerow new NotFoundException(`EmployeePayroll with ID ${id} not found`);
    }

    return payroll;
  }

  async update(
    id: number,
    updateEmployeePayrollInput: UpdateEmployeePayrollInput
  ): Promise<EmployeePayroll> {
    const employeePayroll = await this.findOne(id); // Ensure the record exists

    return this.prisma.employeePayroll.update({
      where: { id },
      data: {
        employeeName:
          updateEmployeePayrollInput.employeeName ??
          employeePayroll.employeeName,

        workingconsumers:
          updateEmployeePayrollInput.workingconsumers ?? employeePayroll.workingconsumers,

        rate: updateEmployeePayrollInput.rate ?? employeePayroll.rate,

        salary: updateEmployeePayrollInput.salary ?? employeePayroll.salary,

        OT: updateEmployeePayrollInput.OT ?? employeePayroll.OT,

        doubleOT:
          updateEmployeePayrollInput.doubleOT ?? employeePayroll.doubleOT,

        PTO: updateEmployeePayrollInput.PTO ?? employeePayroll.PTO,

        holidayPay:
          updateEmployeePayrollInput.holidayPay ?? employeePayroll.holidayPay,

        bonus: updateEmployeePayrollInput.bonus ?? employeePayroll.bonus,

        commission:
          updateEmployeePayrollInput.commission ?? employeePayroll.commission,

        total: updateEmployeePayrollInput.total ?? employeePayroll.total,

        grossPay:
          updateEmployeePayrollInput.grossPay ?? employeePayroll.grossPay,

        netPay: updateEmployeePayrollInput.netPay ?? employeePayroll.netPay,

        // Handling profileId as a foreign key relation
        profile: updateEmployeePayrollInput.profileId
          ? { connect: { id: updateEmployeePayrollInput.profileId } }
          : undefined,

        employeeContribution:
          updateEmployeePayrollInput.employeeContribution ??
          employeePayroll.employeeContribution,

        employeeDeduction:
          updateEmployeePayrollInput.employeeDeduction ??
          employeePayroll.employeeDeduction,

        // Handle the nested netPaySummary with Prisma's nested update
        netPaySummary: updateEmployeePayrollInput.netPaySummary
          ? updateEmployeePayrollInput.netPaySummary
          : null,
      },
    });
  }

  async remove(id: number): Promise<EmployeePayroll> {
    await this.findOne(id); // Ensure existence
    return this.prisma.employeePayroll.delete({
      where: { id },
    });
  }

  async search(
    query: string,
    page = 1,
    limit = 10
  ): Promise<EmployeePayrollPaginatedResult> {
    const skip = (page - 1) * limit;

    const [employeePayrolls, totalCount] = await Promise.all([
      this.prisma.employeePayroll.findMany({
        where: {
          OR: [{ employeeName: { contains: query, mode: "insensitive" } }],
        },
        skip,
        take: limit,
        orderBy: {
          id: "desc",
        },
      }),
      this.prisma.employeePayroll.count({
        where: {
          OR: [{ employeeName: { contains: query, mode: "insensitive" } }],
        },
      }),
    ]);

    return {
      payrolls: employeePayrolls,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

  async calculationEmployeePayrollInput(
    input: string
  ): Promise<EmployeePayrollProcess[]> {
    let strArray = [];

    if (typeof input === "string") {
      const onceParsed = JSON.parse(input);
      strArray =
        typeof onceParsed === "string" ? JSON.parse(onceParsed) : onceParsed;
    } else {
      strArray = input;
    }

    if (!Array.isArray(strArray)) {
      tconsumerow new Error("Parsed input is not an array");
    }

    if (strArray.length === 0) {
      return [];
    }

    const returnResData: EmployeePayrollProcess[] = await Promise.all(
      strArray.map(async (e) => {
        const profile = await this.prisma.profile.findUnique({
          where: {
            id: e.profileID,
          },
          include: {
            profileDetails: true,
          },
        });

        const marriedStatus =
          profile?.profileDetails?.maritalStatus || "Single";

        const netPaySummary = await this.netPaySummaryCalculation(
          parseFloat(e.grossPay),
          20
        );

        const netPay = await this.netPayCalculation(
          parseFloat(e.grossPay),
          marriedStatus,
          e.employeeDeduction
        );

        const previousCalculatedFederalData =
          await this.prisma.employeePayroll.findMany({
            where: {
              profileId: e.profileID,
            },
            select: {
              netPaySummary: true,
            },
          });

        let totalSummary = {
          employeeDta: {
            federalTaxWithHoldingYearly: 0,
            medicareTax: 0,
            socialSecurityTax: 0,
            taxableIncome: 0,
            federalTaxWithHoldingMonthlyRate: 0,
            federalTaxWithHoldingWeeklyRate: 0,
            federalTaxWithHoldingHourlyRate: 0,
          },
          employerDta: {
            medicareTax: 0,
            socialSecurityTax: 0,
            additionalMedicareTax: 0,
            futaTax: 0,
          },
        };

        for (const record of previousCalculatedFederalData) {
          try {
            const summary = JSON.parse(record.netPaySummary);

            // Employee data
            totalSummary.employeeDta.federalTaxWithHoldingYearly +=
              summary?.employeeDta?.federalTaxWithHoldingYearly || 0;
            totalSummary.employeeDta.medicareTax +=
              summary?.employeeDta?.medicareTax || 0;
            totalSummary.employeeDta.socialSecurityTax +=
              summary?.employeeDta?.socialSecurityTax || 0;
            totalSummary.employeeDta.taxableIncome +=
              summary?.employeeDta?.taxableIncome || 0;
            totalSummary.employeeDta.federalTaxWithHoldingMonthlyRate +=
              summary?.employeeDta?.federalTaxWithHoldingMonthlyRate || 0;
            totalSummary.employeeDta.federalTaxWithHoldingWeeklyRate +=
              summary?.employeeDta?.federalTaxWithHoldingWeeklyRate || 0;
            totalSummary.employeeDta.federalTaxWithHoldingHourlyRate +=
              summary?.employeeDta?.federalTaxWithHoldingHourlyRate || 0;

            // Employer data
            totalSummary.employerDta.medicareTax +=
              summary?.employerDta?.medicareTax || 0;
            totalSummary.employerDta.socialSecurityTax +=
              summary?.employerDta?.socialSecurityTax || 0;
            totalSummary.employerDta.additionalMedicareTax +=
              summary?.employerDta?.additionalMedicareTax || 0;
            totalSummary.employerDta.futaTax +=
              summary?.employerDta?.futaTax || 0;
          } catch (error) {
            console.error(
              "Failed to parse netPaySummary:",
              record.netPaySummary,
              error
            );
          }
        }

        const data: EmployeePayrollProcess = {
          id: parseInt(e.id) || 0,
          employeeName: e.employeeName,
          workingconsumers: e.workingconsumers,
          Rate: e.Rate,
          Salary: e.Salary,
          OT: e.OT,
          doubleOT: e.doubleOT,
          PTO: e.PTO,
          holydayPay: e.holydayPay,
          bonus: e.bonus,
          commission: e.commission,
          total: e.total,
          employeeContribution: e.employeeContribution,
          employeeDeduction: e.employeeDeduction,
          grossPay: e.grossPay,
          netPay: netPay,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
          netPaySummary: netPaySummary,
          profileID: e.profileID,
          storeNetPaySummary: totalSummary,
          profile: profile,
        };

        return data;
      })
    );

    return returnResData;
  }

  private async netPayDetails(
    grossPay: number,
    paySchedule: any,
    details: any,
    rate: string,
    workingHours: number
  ) {
    const yearlySealery = parseFloat(rate) * 8 * 5 * 52;
    const workingWeeklyHour = details.hoursPerDay * details.dayForWeek;

    let employeeDta = await this.payrollTaxService.taxRate(
      yearlySealery,
      FilingStatus.SINGLE
    );

    let returnData = employeeDta;

    if (details.payType === "HOURLY") {
    } else {
    }

    console.log(
      "grossPay",
      grossPay,
      "paySchedule",
      // paySchedule,
      "details",
      details.payType,
      details.payFrequency,
      "rate",
      rate,
      "workingHours",
      workingHours,
      parseFloat(rate) * 8 * 5 * 52,
      employeeDta.federalTaxWithHoldingHourlyRate * workingHours,
      ":::",
      employeeDta.federalTaxWithHoldingHourlyRate * 8 * 5 * 4,
      employeeDta.federalTaxWithHoldingHourlyRate * 8 * 5 * 52,
      employeeDta
    );

    await netPayHelper(
      details,
      grossPay,
      paySchedule,
      parseInt(rate),
      workingHours
    );
  }
}
