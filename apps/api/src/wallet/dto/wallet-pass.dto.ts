import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum WalletPlatform {
  apple = 'apple',
  google = 'google',
}

export class WalletPassDto {
  @ApiProperty({ enum: WalletPlatform })
  @IsEnum(WalletPlatform)
  platform!: WalletPlatform;
}
