import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ConfirmParseReviewDto {
  @IsOptional()
  @IsString()
  merchant_name?: string;

  @IsOptional()
  @IsString()
  external_order_id?: string;

  @IsOptional()
  @IsString()
  item_summary?: string;

  @IsOptional()
  @IsNumber()
  expected_refund_amount?: number;

  @IsOptional()
  @IsString()
  return_deadline_at?: string;
}
