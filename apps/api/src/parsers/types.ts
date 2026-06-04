export interface ParsedReceipt {
  merchantName: string;
  merchantDomain?: string;
  externalOrderId: string;
  orderDate?: Date;
  totalAmount?: number;
  currency?: string;
  itemSummary?: string;
  returnDeadlineAt?: Date;
  returnWindowDays?: number;
  trackingNumbers?: string[];
  qrPayload?: string;
  qrFormat?: string;
  confidence: number;
}

export interface ParseInput {
  from: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}
