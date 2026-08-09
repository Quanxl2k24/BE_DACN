import { Module } from '@nestjs/common';
import { JobCategoryController } from './job-category.controller';
import { JobCategoryService } from './job-category.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [JobCategoryController],
  providers: [JobCategoryService],
})
export class JobCategoryModule {}
