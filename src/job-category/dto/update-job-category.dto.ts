import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobCategoryDTO {
  @ApiPropertyOptional({ description: 'Tên danh mục ngành nghề', example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
