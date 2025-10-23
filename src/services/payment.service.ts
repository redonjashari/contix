import Stripe from 'stripe';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { env } from '../config/env.js';
import { TicketService } from './ticket.service.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

const prisma = new PrismaClient();
const ticketService = new TicketService();

export class PaymentService {
  /**
   * Creates a Stripe Payment Intent for a hold.
   * Client uses this to confirm payment on frontend.
   */
  async createPaymentIntent(holdToken: string, userId: string) {
    // Validate hold
    const holds = await prisma.hold.findMany({
      where: {
        holdToken,
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        seat: true,
        event: true,
      },
    });

    if (holds.length === 0) {
      throw new Error('Invalid or expired hold');
    }

    const totalAmount = holds.reduce(
      (sum, h) => sum + Number(h.seat.price),
      0
    );

    // Create order in PENDING status
    const order = await prisma.order.create({
      data: {
        userId,
        eventId: holds[0]!.eventId,
        totalAmount,
        currency: 'usd',
        status: 'PENDING',
        paymentProvider: 'stripe',
        holdToken,
      },
    });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        holdToken,
        userId,
      },
    });

    // Store payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'stripe',
        amount: totalAmount,
        currency: 'usd',
        status: 'PENDING',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      amount: totalAmount,
    };
  }

  /**
   * Handles Stripe webhook events.
   * Called when payment succeeds/fails.
   * 
   * Critical flow for finalizing ticket purchase:
   * 1. Verify webhook signature
   * 2. Extract order ID from metadata
   * 3. In transaction:
   *    - Update order status to PAID
   *    - Mark seats as SOLD
   *    - Delete holds
   *    - Generate tickets with QR codes
   */
  async handleWebhook(payload: string, signature: string) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      
      if (!orderId) {
        throw new Error('Order ID not found in payment intent metadata');
      }

      await this.finalizeOrder(orderId);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      
      if (!orderId) {
        throw new Error('Order ID not found in payment intent metadata');
      }

      await this.failOrder(orderId);
    }

    return { received: true };
  }

  /**
   * Finalizes order after successful payment.
   * Atomic transaction ensures consistency.
   */
  private async finalizeOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get order with holds
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
        },
      });

      if (!order || !order.holdToken) {
        throw new Error('Order not found or invalid');
      }

      // Get all holds for this order
      const holds = await tx.hold.findMany({
        where: { holdToken: order.holdToken },
        include: { seat: true },
      });

      if (holds.length === 0) {
        throw new Error('No holds found for order');
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentProviderRef: orderId,
        },
      });

      // Update payment status
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: 'SUCCEEDED' },
      });

      // Mark seats as SOLD
      const seatIds = holds.map(h => h.seatId);
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'SOLD' },
      });

      // Delete holds
      await tx.hold.deleteMany({
        where: { holdToken: order.holdToken },
      });

      // Generate tickets
      const tickets = await Promise.all(
        holds.map(hold =>
          ticketService.generateTicket(tx, orderId, hold.seatId)
        )
      );

      return {
        orderId,
        tickets,
      };
    });
  }

  private async failOrder(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELED' },
    });

    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: 'FAILED' },
    });
  }
}
