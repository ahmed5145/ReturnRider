/**
 * Run: npx ts-node src/seed/seed.ts
 * Seeds demo user, order, and return for local development.
 */
import { PrismaClient, ReturnStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { externalAuthId: 'dev-user' },
    create: {
      externalAuthId: 'dev-user',
      email: 'dev@returnrider.com',
      displayName: 'Dev User',
    },
    update: {},
  });

  const order = await prisma.order.upsert({
    where: {
      userId_merchantName_externalOrderId: {
        userId: user.id,
        merchantName: 'ASOS',
        externalOrderId: 'DEMO-12345',
      },
    },
    create: {
      userId: user.id,
      merchantName: 'ASOS',
      merchantDomain: 'asos.com',
      externalOrderId: 'DEMO-12345',
      totalAmount: 42.0,
      rawConfidence: 0.95,
    },
    update: {},
  });

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 11);

  const existing = await prisma.return.findFirst({
    where: { orderId: order.id },
  });

  if (!existing) {
    await prisma.return.create({
      data: {
        userId: user.id,
        orderId: order.id,
        status: ReturnStatus.ready_to_ship,
        itemSummary: 'Linen blend shirt — Size M',
        expectedRefundAmount: 42.0,
        returnDeadlineAt: deadline,
        returnWindowDays: 28,
        qrPayload: 'RETURN-DEMO-QR-PAYLOAD',
        qrFormat: 'QR_CODE',
      },
    });
  }

  console.log('Seed complete for dev@returnrider.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
