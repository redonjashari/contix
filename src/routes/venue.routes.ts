import { type FastifyInstance } from 'fastify';
import { listVenues, getVenue } from '../controllers/venue.controller.js';

export async function venueRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              capacity: { type: 'number' },
              events: { type: 'array' },
            },
          },
        },
      },
    },
  }, listVenues);

  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          includeEvents: { type: 'string', enum: ['0', '1'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            capacity: { type: 'number' },
            events: { type: 'array' },
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
  }, getVenue);
}
