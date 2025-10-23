import type { FastifyRequest, FastifyReply } from 'fastify';
import { SeatService } from '../services/seat.service.js';

const seatService = new SeatService();

export async function getEventSeats(
  request: FastifyRequest<{
    Params: { eventId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { eventId } = request.params;
    const result = await seatService.getEventSeats(eventId);
    reply.send(result);
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}
