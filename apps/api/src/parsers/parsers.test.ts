import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyEmailIntent,
  isCommerceEmail,
  isPromotionalOrNonReturnEmail,
} from './commerce-classifier';
import { scoreParseConfidence } from './parse-scoring';
import { addReturnWindow, parseGmailInternalDate } from './parser-utils';
import { parseReceipt } from './merchants';
import type { ParseInput } from './types';

function sample(overrides: Partial<ParseInput>): ParseInput {
  return {
    from: 'orders@target.com',
    subject: 'Thanks for your order',
    htmlBody: '<p>Order #1234567890 Total $42.99</p>',
    textBody: 'Order #1234567890 Total $42.99',
    ...overrides,
  };
}

describe('commerce-classifier', () => {
  it('rejects generic noreply without retailer domain', () => {
    assert.equal(
      isCommerceEmail('noreply@random-marketing.com', 'Your order summary'),
      false,
    );
  });

  it('accepts known retailer sender', () => {
    assert.equal(isCommerceEmail('auto-confirm@target.com', 'Order confirmed'), true);
  });

  it('blocks promotional subjects', () => {
    assert.equal(
      isPromotionalOrNonReturnEmail('deals@target.com', '25% off — members only sale'),
      true,
    );
  });

  it('blocks marketing sender without return keywords', () => {
    assert.equal(
      isPromotionalOrNonReturnEmail('deals@amazon.com', 'Top deals for you this week'),
      true,
    );
    assert.equal(
      isCommerceEmail('deals@amazon.com', 'Your return label is ready'),
      true,
    );
  });

  it('blocks walmart promo but accepts order confirm', () => {
    assert.equal(isCommerceEmail('noreply@walmart.com', 'Save up to 50% — shop now'), false);
    assert.equal(
      isCommerceEmail('help@walmart.com', 'Thanks for your order #1234567890'),
      true,
    );
  });

  it('blocks nike newsletter subjects', () => {
    assert.equal(
      isPromotionalOrNonReturnEmail('noreply@nike.com', 'New arrivals — shop our latest'),
      true,
    );
  });

  it('classifies shipped vs order confirm', () => {
    assert.equal(classifyEmailIntent('Your package has shipped'), 'shipped');
    assert.equal(classifyEmailIntent('Thank you for your order'), 'order_confirm');
    assert.equal(classifyEmailIntent('Your return label is ready'), 'return_label');
  });
});

describe('parseReceipt', () => {
  it('parses Target order confirmation with deadline', () => {
    const result = parseReceipt(sample({ from: 'orders@target.com' }));
    assert.ok(result);
    assert.equal(result.merchantName, 'Target');
    assert.equal(result.emailIntent, 'order_confirm');
    assert.ok(result.returnDeadlineAt);
    assert.ok(result.confidence >= 0.85);
  });

  it('skips Target shipped-only notification', () => {
    const result = parseReceipt(
      sample({
        subject: 'Your package has shipped',
        htmlBody: '<p>Order #1234567890 tracking 1Z999</p>',
        textBody: 'Order #1234567890 tracking 1Z999',
      }),
    );
    assert.equal(result, null);
  });

  it('skips Amazon promotional mail', () => {
    const result = parseReceipt(
      sample({
        from: 'deals@amazon.com',
        subject: 'Deal of the day — 40% off',
        htmlBody: 'Order #111-2222222-3333333',
        textBody: 'Order #111-2222222-3333333',
      }),
    );
    assert.equal(result, null);
  });

  it('parses Amazon order confirmation with email date', () => {
    const emailDate = new Date('2024-03-01T10:00:00.000Z');
    const result = parseReceipt(
      sample({
        from: 'order-update@amazon.com',
        subject: 'Your Amazon.com order',
        htmlBody:
          'Order #111-2222222-3333333 Total $29.99 Thank you for your order confirmation',
        textBody:
          'Order #111-2222222-3333333 Total $29.99 Thank you for your order confirmation',
        emailDate,
      }),
    );
    assert.ok(result);
    assert.equal(result.merchantName, 'Amazon');
    assert.ok(result.orderDate);
    assert.equal(result.orderDate.getTime(), emailDate.getTime());
  });

  it('skips best buy shipped notification', () => {
    const result = parseReceipt(
      sample({
        from: 'noreply@bestbuy.com',
        subject: 'Your package has shipped',
        htmlBody: 'Order #BBY01-123456789 tracking 1Z999',
        textBody: 'Order #BBY01-123456789 tracking 1Z999',
      }),
    );
    assert.equal(result, null);
  });

  it('caps generic parser below auto-create threshold', () => {
    const result = parseReceipt(
      sample({
        from: 'returns@unknown-shop.com',
        subject: 'Your return label',
        htmlBody: 'Order number: ABC123456789',
        textBody: 'Order number: ABC123456789 Refund $10',
      }),
    );
    assert.ok(result);
    assert.ok(result.confidence <= 0.84);
  });

  it('uses Gmail emailDate for order deadlines on backfill', () => {
    const emailDate = new Date('2024-01-15T12:00:00.000Z');
    const result = parseReceipt(sample({ from: 'orders@target.com', emailDate }));
    assert.ok(result);
    assert.ok(result.orderDate);
    assert.equal(result.orderDate.getTime(), emailDate.getTime());
    const windowDays = result.returnWindowDays ?? 30;
    const expected = addReturnWindow(emailDate, windowDays);
    assert.equal(result.returnDeadlineAt?.getTime(), expected.getTime());
  });

  it('parses Gmail internalDate milliseconds', () => {
    const d = parseGmailInternalDate('1705320000000');
    assert.ok(d);
    assert.equal(d.getTime(), 1705320000000);
  });

  it('marks dedicated merchants for auto-create', () => {
    const result = parseReceipt(sample({ from: 'orders@target.com' }));
    assert.equal(result?.parserTier, 'merchant');
  });

  it('marks generic parser for review queue', () => {
    const result = parseReceipt(
      sample({
        from: 'returns@unknown-shop.com',
        subject: 'Your return label',
        htmlBody: 'Order number: ABC123456789',
        textBody: 'Order number: ABC123456789 Refund $10',
      }),
    );
    assert.equal(result?.parserTier, 'generic');
  });

  it('scores return labels higher than order confirms', () => {
    const returnScore = scoreParseConfidence({
      intent: 'return_label',
      merchantSpecific: true,
      hasOrderId: true,
      hasAmount: true,
      hasLabelUrl: true,
    });
    const orderScore = scoreParseConfidence({
      intent: 'order_confirm',
      merchantSpecific: true,
      hasOrderId: true,
      hasAmount: true,
      hasLabelUrl: false,
    });
    assert.ok(returnScore > orderScore);
  });
});
