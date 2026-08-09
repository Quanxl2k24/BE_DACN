import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobCategoryDTO {
  @ApiProperty({ description: 'Tên danh mục ngành nghề', example: 'Công nghệ thông tin' })
  @IsString()
  @MaxLength(255)
  name!: string;
}
