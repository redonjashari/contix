// src/services/order.service.ts
// Creates an Order in DB and a Stripe PaymentIntent, and stores a Payment record.
// Make sure stripe client is configured in src/config/stripe.ts.
// This is a skeleton — you should add idempotency, validation, and webhook handling.

import prisma from '../config/database.js';
import { stripe } from '../config/stripe.js';
import { Prisma } from '@prisma/client';

type CreateOrderOpts = {
  userId: string;
  eventId: string;
  totalInCents: number; // integer cents
  currency?: string; // 'usd' / 'eur' etc.
  holdToken?: string | null;
};

export const OrderService = {
  // create order record
  async createOrder(opts: CreateOrderOpts) {
    const { userId, eventId, totalInCents, currency = 'usd', holdToken } = opts;

    const totalAmountDecimal = new Prisma.Decimal((totalInCents / 100).toFixed(2));

    const order = await prisma.order.create({
      data: {
        userId,
        eventId,
        totalAmount: totalAmountDecimal,
        currency,
        status: 'PENDING',
        holdToken: holdToken ?? null,
      },
    });

    return order;
  },

  // create stripe intent and create a Payment row referencing stripe
  async createPaymentIntentForOrder(orderId: string, totalInCents: number, currency = 'usd') {
    // create stripe payment intent (amount in cents)
    const pi = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency,
      metadata: { orderId },
    });

    // create DB payment record with provider referencing the payment intent id
    const payment = await prisma.payment.create({
      data: {
        orderId,
        provider: 'stripe',
        providerEvent: pi.id,
        status: 'PENDING',
        amount: new Prisma.Decimal((totalInCents / 100).toFixed(2)),
        currency,
      },
    });

    return { payment, clientSecret: pi.client_secret };
  },

  // You will call this from your webhook handler when Stripe reports success.
  async finalizePayment(paymentProviderEventId: string) {
    // find payment
    const payment = await prisma.payment.findUnique({ where: { providerEvent: paymentProviderEventId } });
    if (!payment) throw new Error('Payment not found');

    // transaction: mark payment succeeded and order PAID, update seats/tickets as needed
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED' } });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });

      // If you are using holdToken to represent held seats, you can:
      // 1) find the holds attached to order.holdToken
      // 2) change seat.status to SOLD
      // 3) create tickets for each seat
      // Because this project may vary, only leave a guideline here.
    });

    return true;
  },
};
