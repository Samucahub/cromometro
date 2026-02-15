import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStatusDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}
