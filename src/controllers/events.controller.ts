import type { FastifyReply, FastifyRequest } from 'fastify';
import { EventService } from '../services/events.service.js';


export const EventsController = {
async listUpcoming(request: FastifyRequest, reply: FastifyReply) {
const events = await EventService.listUpcoming();
reply.send(events);
},


async getById(request: FastifyRequest, reply: FastifyReply) {
const { id } = request.params as any;
const event = await EventService.getById(id);
if (!event) return reply.code(404).send({ error: 'Not found' });
reply.send(event);
},
};