import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
