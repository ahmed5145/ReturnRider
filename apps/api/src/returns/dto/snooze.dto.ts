import { IsIn, IsOptional } from 'class-validator';

export class SnoozeDto {
  @IsOptional()
  @IsIn(['24h', 'weekend'])
  mode?: '24h' | 'weekend';
}
