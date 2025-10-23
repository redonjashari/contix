import { type FastifyInstance } from 'fastify';
import { EventsController } from '../controllers/events.controller.js';

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              startAt: { type: 'string' },
              endAt: { type: 'string' },
              genre: { type: 'string' },
              posterPath: { type: 'string' },
              venue: { type: 'object' },
            },
          },
        },
      },
    },
  }, EventsController.listUpcoming);

  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            startAt: { type: 'string' },
            endAt: { type: 'string' },
            genre: { type: 'string' },
            posterPath: { type: 'string' },
            venue: { type: 'object' },
            seats: { type: 'array' },
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
  }, EventsController.getById);
}
