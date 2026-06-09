import { IsOptional, IsString, MinLength } from 'class-validator';

export class AddTrackingDto {
  @IsString()
  @MinLength(6)
  tracking_number!: string;

  @IsOptional()
  @IsString()
  carrier?: string;
}
