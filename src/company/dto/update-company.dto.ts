import { IsEmail, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDTO {
  @ApiPropertyOptional({ description: 'Tên công ty', example: 'Công ty TNHH ABC' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Mã số thuế', example: '0123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @ApiPropertyOptional({ description: 'Email công ty', example: 'contact@abc.vn' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0281234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ công ty', example: '123 Nguyễn Huệ, Q.1, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Website', example: 'https://abc.vn' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'URL logo công ty', example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Quy mô nhân sự', example: '10-50' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  workforceSize?: string;

  @ApiPropertyOptional({ description: 'Năm thành lập', example: 2015 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(Number(new Date().getFullYear()))
  youndedYear?: number;

  @ApiPropertyOptional({ description: 'Loại công ty', example: 'Công nghệ thông tin' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyType?: string;

  @ApiPropertyOptional({ description: 'Mô tả về công ty', example: 'Công ty hoạt động trong lĩnh vực công nghệ' })
  @IsOptional()
  @IsString()
  description?: string;
}
