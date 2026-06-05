import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export enum EmailProviderDto {
  gmail = 'gmail',
  outlook = 'outlook',
  yahoo = 'yahoo',
  icloud = 'icloud',
}

export class EmailConnectDto {
  @ApiProperty({ enum: EmailProviderDto })
  @IsEnum(EmailProviderDto)
  provider!: EmailProviderDto;

  @ApiProperty()
  @IsString()
  authorization_code!: string;

  @ApiProperty({ example: 'com.returnrider.app:/oauth2redirect' })
  @IsString()
  redirect_uri!: string;

  @ApiProperty()
  @IsString()
  code_verifier!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email_hint?: string;

  @ApiPropertyOptional({ enum: [90, 180], default: 90 })
  @IsOptional()
  @IsIn([90, 180])
  sync_days?: 90 | 180;
}
