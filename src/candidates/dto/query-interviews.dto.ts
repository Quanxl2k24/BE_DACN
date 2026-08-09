import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInterviewsDTO {
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
