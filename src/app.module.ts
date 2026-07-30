import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { PermissonsModule } from './permissons/permissons.module';
import { BullModule } from '@nestjs/bull';
import { EmailModule } from './email/email.module';
import { JobModule } from './job/job.module';
import { SkillsModule } from './skills/skills.module';
import { JobReportModule } from './job-report/job-report.module';
import { UploadModule } from './upload/upload.module';
import { ApplicationModule } from './application/application.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL'),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          secure: false,
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
          tls: {
            rejectUnauthorized: false,
          },
          requireTLS: true,
          connectionTimeout: 10000,
        },
        defaults: { from: `"No Reply" <${config.get<string>('MAIL_FROM')}>` },
      }),
    }),
    AuthModule,
    PrismaModule,
    UserModule,
    CompanyModule,
    PermissonsModule,
    EmailModule,
    JobModule,
    SkillsModule,
    JobReportModule,
    UploadModule,
    ApplicationModule,
  ],
  providers: [AppService],
})
export class AppModule {}
