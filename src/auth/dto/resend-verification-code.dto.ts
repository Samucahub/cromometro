import { IsEmail, IsOptional, MinLength } from 'class-validator';

export class ResendVerificationCodeDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username?: string;
}
