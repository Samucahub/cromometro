import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  @IsString()
  refresh_token: string;
}

export class RefreshTokenResponseDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
