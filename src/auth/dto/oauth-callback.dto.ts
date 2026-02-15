import { IsEmail, IsNotEmpty } from 'class-validator';

export class OAuthCallbackDto {
  @IsNotEmpty()
  provider: string; // 'google' or 'github'

  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  name: string;

  picture?: string;
}
