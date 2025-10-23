import type { FastifyRequest, FastifyReply } from 'fastify';
import { SeatService } from '../services/seat.service.js';

const seatService = new SeatService();

export async function createHold(
  request: FastifyRequest<{
    Params: { eventId: string };
    Body: {
      seats: string[];
      ttlSeconds?: number;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { eventId } = request.params;
    const { seats, ttlSeconds } = request.body;

    const result = await seatService.createHold({
      userId: user.id,
      eventId,
      seatCodes: seats,
      ttlSeconds,
    });

    reply.code(201).send(result);
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
}

export async function getHoldStatus(
  request: FastifyRequest<{
    Params: { holdToken: string };
  }>,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { holdToken } = request.params;

    const result = await seatService.validateHold(holdToken, user.id);
    
    reply.send({
      holdToken,
      expiresAt: result.holds[0]?.expiresAt,
      heldSeats: result.holds.map(h => ({
        seatId: h.seatId,
        section: h.seat.section,
        row: h.seat.row,
        number: h.seat.number,
        price: Number(h.seat.price),
      })),
      totalAmount: result.totalAmount,
      valid: true,
    });
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}
