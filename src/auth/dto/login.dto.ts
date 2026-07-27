import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginReqDTO {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
