import { type FastifyInstance } from 'fastify';
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  createVenue, 
  updateVenue, 
  deleteVenue,
  createSeats,
  getUsers,
  getUserStats
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createEventSchema, createVenueSchema, createSeatSchema } from '../utils/validation.schemas.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Events
  fastify.post('/events', {
    preHandler: requireAuth,
    schema: {
      body: createEventSchema,
      response: {
        201: {
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
  }, createEvent);

  fastify.put('/events/:id', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: createEventSchema,
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
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, updateEvent);

  fastify.delete('/events/:id', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null' },
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
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, deleteEvent);

  // Venues
  fastify.post('/venues', {
    preHandler: requireAuth,
    schema: {
      body: createVenueSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            capacity: { type: 'number' },
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
  }, createVenue);

  fastify.put('/venues/:id', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: createVenueSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            capacity: { type: 'number' },
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
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, updateVenue);

  fastify.delete('/venues/:id', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null' },
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
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, deleteVenue);

  // Seats
  fastify.post('/events/:eventId/seats', {
    preHandler: requireAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
        },
        required: ['eventId'],
      },
      body: {
        type: 'object',
        properties: {
          seats: {
            type: 'array',
            items: createSeatSchema,
          },
        },
        required: ['seats'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            count: { type: 'number' },
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
  }, createSeats);

  // Users
  fastify.get('/users', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string' },
          offset: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              isVerified: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
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
  }, getUsers);

  fastify.get('/stats/users', {
    preHandler: requireAuth,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            verified: { type: 'number' },
            unverified: { type: 'number' },
            admins: { type: 'number' },
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
  }, getUserStats);
}
