import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class QueryApplicationsDTO {
  @ApiPropertyOptional({ description: 'Lọc theo ID tin tuyển dụng', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus, description: 'Lọc theo trạng thái', example: 'APPLIED' })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Từ khoá tìm kiếm trong CV', example: 'React' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Tên ứng viên', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  applicantName?: string;

  @ApiPropertyOptional({ description: 'Từ ngày', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Đến ngày', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Sắp xếp (oldest | newest)', example: 'newest' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Cursor cho phân trang', example: 'uuid' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Số lượng bản ghi mỗi trang', example: '20' })
  @IsOptional()
  @IsString()
  take?: string;
}
