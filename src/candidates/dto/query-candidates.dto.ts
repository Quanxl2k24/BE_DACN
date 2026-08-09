import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class QueryCandidatesDTO {
  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên ứng viên', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus, description: 'Lọc theo trạng thái đơn ứng tuyển', example: 'APPLIED' })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Lọc theo ID tin tuyển dụng cụ thể', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Chỉ lấy ứng viên của các tin tuyển dụng đang mở và còn thời hạn', example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  onlyActiveJobs?: boolean;

  @ApiPropertyOptional({ description: 'Cursor phân trang (ID của bản ghi cuối cùng)', example: 'uuid' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Số lượng bản ghi mỗi trang', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}
