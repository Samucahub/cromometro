import { IsNotEmpty, IsString } from 'class-validator';

export class RequestLeadershipTransferDto {
  @IsNotEmpty()
  @IsString()
  toUserId: string;
}
