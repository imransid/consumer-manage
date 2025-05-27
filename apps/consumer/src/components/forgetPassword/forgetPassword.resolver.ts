import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ForgotPasswordInput } from '../dto/forgetPassword.input';
import { ForgotPasswordService } from './forgetPassword.service';
import { ForgetPassword } from '../entities/forgetPassword.entity';

@Resolver()
export class ForgetPasswordResolver {
  constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

  @Mutation(() => ForgetPassword)
  async forgotPassword(
    @Args('input') input: ForgotPasswordInput,
  ): Promise<ForgetPassword> {
    return await this.forgotPasswordService.requestPasswordReset(input.email, input.callBackUrl);
  }

  @Mutation(() => ForgetPassword)
  async resetPassword(
    @Args('userId') userId: number,
    @Args('newPassword') newPassword: string,
  ): Promise<ForgetPassword> {
    return this.forgotPasswordService.resetPassword(userId, newPassword);
  }
}
