import type { EmailIntent } from './commerce-classifier';

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
  returnLabelUrl?: string;
  emailIntent?: EmailIntent;
  confidence: number;
}

export interface ParseInput {
  from: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}
