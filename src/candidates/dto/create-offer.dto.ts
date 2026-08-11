import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDTO {
  @ApiProperty({ description: 'Mức lương đề nghị (VNĐ)', example: 20000000 })
  @IsInt()
  @Min(0)
  salary!: number;

  @ApiPropertyOptional({ description: 'Ngày dự kiến bắt đầu làm việc (ISO 8601)', example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Hạn chót ứng viên phản hồi (ISO 8601)', example: '2026-08-20' })
  @IsOptional()
  @IsDateString()
  responseDeadline?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm về lời mời', example: 'Bao gồm bảo hiểm sức khỏe, 12 ngày phép/năm' })
  @IsOptional()
  @IsString()
  note?: string;
}
