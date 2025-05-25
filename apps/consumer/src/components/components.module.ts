import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserResolver } from './user/user.resolver';
import { UserService } from './user/user.service';
import { MessageResolver } from './message/message.resolver';
import { MessageService } from './message/message.service';
import { PubSubModule } from '../pubsub/pubsub.module';
import { NotificationResolver } from './notification/notification.resolver';
import { NotificationService } from './notification/notification.service';
import { AppointmentResolver } from './appointment/appointment.resolver';
import { AppointmentService } from './appointment/appointment.service';
import { ReviewResolver } from './review/review.resolver';
import { ReviewService } from './review/review.service';
// import { DocumentationResolver } from './documentaion/documentation.resolver';
// import { DocumentationService } from './documentaion/documentation.service';

@Module({
  imports: [
    PrismaModule,
    PubSubModule,
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
    UserResolver,
    UserService,
    MessageResolver,
    MessageService,
    NotificationResolver,
    NotificationService,
    AppointmentResolver,
    AppointmentService,
    ReviewResolver,
    ReviewService,
    // DocumentationResolver,
    // DocumentationService,
  ],
})
export class ComponentsModule {}
