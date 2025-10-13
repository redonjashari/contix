import type { FastifyRequest, FastifyReply } from 'fastify';
import { TicketService } from '../services/ticket.service.js';

const ticketService = new TicketService();

export async function getOrderTickets(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const tickets = await ticketService.getOrderTickets(request.params.id);
    reply.send({ tickets });
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}

export async function validateTicket(
  request: FastifyRequest<{
    Params: { code: string };
  }>,
  reply: FastifyReply
) {
  try {
    const ticket = await ticketService.getTicketByCode(request.params.code);
    reply.send({
      valid: ticket.order.status === 'PAID',
      ticket,
    });
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}

export async function scanTicket(
  request: FastifyRequest<{
    Body: {
      ticketCode: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const result = await ticketService.scanTicket(request.body.ticketCode);
    reply.send(result);
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
}