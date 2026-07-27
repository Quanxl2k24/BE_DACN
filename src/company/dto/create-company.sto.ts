import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCompanyDTO {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
