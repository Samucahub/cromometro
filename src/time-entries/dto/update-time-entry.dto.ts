import { IsDateString, IsOptional } from 'class-validator';

export class UpdateTimeEntryDto {
  @IsOptional()
  taskId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}