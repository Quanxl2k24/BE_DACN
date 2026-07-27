import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';

export class CreateJobDTO {
  @ApiProperty({ description: 'Tiêu đề tin tuyển dụng', example: 'Senior Node.js Developer' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ enum: JobStatus, description: 'Trạng thái tin', example: 'DRAFT' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Mô tả công việc', example: 'Chúng tôi đang tìm kiếm...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID công ty', example: 'uuid' })
  @IsUUID()
  companyId!: string;

  @ApiPropertyOptional({ description: 'Mức lương tối thiểu', example: 10000000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Mức lương tối đa', example: 30000000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: 'Yêu cầu công việc', example: '3+ năm kinh nghiệm Node.js' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Quyền lợi', example: 'Bảo hiểm, du lịch hàng năm' })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ description: 'Ngày hết hạn', example: '2025-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;

  @ApiPropertyOptional({ description: 'Danh sách ID kỹ năng', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  skillIds?: number[];

  @ApiPropertyOptional({ description: 'Địa chỉ làm việc', example: '123 Nguyễn Huệ, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Tỉnh/Thành phố', example: 'Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;
}
