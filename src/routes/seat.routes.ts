import { type FastifyInstance } from 'fastify';
import { getEventSeats } from '../controllers/seat.controller.js';

export async function seatRoutes(fastify: FastifyInstance) {
  fastify.get('/events/:eventId/seats', {
    schema: {
      params: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
        },
        required: ['eventId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            sections: { type: 'object' },
            summary: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                available: { type: 'number' },
                held: { type: 'number' },
                sold: { type: 'number' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, getEventSeats);
}
