import { type FastifyInstance } from 'fastify';
import { createHold, getHoldStatus } from '../controllers/hold.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createHoldSchema } from '../utils/validation.schemas.js';

export async function holdRoutes(fastify: FastifyInstance) {
  fastify.post('/events/:eventId/holds', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
        },
        required: ['eventId'],
      },
      body: createHoldSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            holdToken: { type: 'string' },
            expiresAt: { type: 'string' },
            heldSeats: { type: 'array' },
            totalAmount: { type: 'number' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, createHold);

  fastify.get('/holds/:holdToken', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          holdToken: { type: 'string' },
        },
        required: ['holdToken'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            holdToken: { type: 'string' },
            expiresAt: { type: 'string' },
            heldSeats: { type: 'array' },
            totalAmount: { type: 'number' },
            valid: { type: 'boolean' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, getHoldStatus);
}
