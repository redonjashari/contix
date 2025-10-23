import {} from 'fastify';
import { OrdersController } from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
export async function orderRoutes(fastify) {
    fastify.post('/', {
        preHandler: requireAuth,
        schema: {
            body: {
                type: 'object',
                properties: {
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                seatId: { type: 'string' },
                                eventId: { type: 'string' },
                            },
                        },
                    },
                    totalInCents: { type: 'number' },
                    currency: { type: 'string', default: 'usd' },
                    eventId: { type: 'string' },
                },
                required: ['totalInCents'],
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        order: { type: 'object' },
                        clientSecret: { type: 'string' },
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
    }, OrdersController.create);
}
