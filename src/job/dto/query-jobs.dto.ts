import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';

export class QueryJobsDTO {
  @ApiPropertyOptional({ description: 'Từ khoá tìm kiếm', example: 'Node.js' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Danh sách ID kỹ năng', example: [1, 2] })
  @IsOptional()
  @IsInt({ each: true })
  @IsArray()
  skillIds?: number[];

  @ApiPropertyOptional({ description: 'Lương tối thiểu', example: 5000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryFrom?: number;

  @ApiPropertyOptional({ description: 'Lương tối đa', example: 50000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryTo?: number;

  @ApiPropertyOptional({ description: 'Tỉnh/Thành phố', example: 'Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ enum: JobStatus, description: 'Lọc theo trạng thái', example: 'PUBLISHED' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Sắp xếp (salary_asc | salary_desc | mặc định: mới nhất)', example: 'salary_desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Cursor cho phân trang (ID của bản ghi cuối cùng)', example: 'uuid' })
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
