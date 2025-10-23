import type { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment.service.js';

const paymentService = new PaymentService();

export async function createPaymentIntent(
  request: FastifyRequest<{
    Body: {
      holdToken: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { holdToken } = request.body;
    const result = await paymentService.createPaymentIntent(holdToken, user.id);
    
    reply.send(result);
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
}

export async function handleWebhook(
  request: FastifyRequest<{
    Body: string;
    Headers: {
      'stripe-signature': string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const signature = request.headers['stripe-signature'];
    const payload = request.body;
    
    const result = await paymentService.handleWebhook(payload, signature);
    reply.send(result);
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
}
