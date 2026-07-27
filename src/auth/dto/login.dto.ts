import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginReqDTO {
  @ApiProperty({ description: 'Email đăng nhập', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Abc@12345' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
