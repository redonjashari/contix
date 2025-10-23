import type { FastifyRequest, FastifyReply } from 'fastify';
import { TicketService } from '../services/ticket.service.js';

const ticketService = new TicketService();

export async function getTicketsByUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const tickets = await ticketService.getTicketsByUser(user.id);
    reply.send(tickets);
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}

export async function getTicketByCode(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const ticket = await ticketService.getTicketByCode(request.params.code);
    reply.send(ticket);
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}

export async function scanTicket(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const result = await ticketService.scanTicket(request.params.code);
    reply.send(result);
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
}