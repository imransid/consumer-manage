import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileResolver } from './user/user.resolver';
import { ProfileService } from './user/profile.service';
import { ProfileDetailsResolver } from './profileDetails/profileDetails.resolver';
import { ProfileDetailsService } from './profileDetails/profileDetails.service';
import { DocumentationResolver } from './documentaion/documentation.resolver';
import { DocumentationService } from './documentaion/documentation.service';

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
    ProfileResolver,
    ProfileService,
    ProfileDetailsResolver,
    ProfileDetailsService,
    DocumentationResolver,
    DocumentationService,
  ],
})
export class ComponentsModule {}
