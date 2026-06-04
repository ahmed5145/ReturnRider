import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

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
}
