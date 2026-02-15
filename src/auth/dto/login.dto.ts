import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/strong-password.validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  username?: string;

  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'A password deve ter: mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial (!@#$%^&*)',
  })
  password: string;
}
