import {} from 'fastify';
import { createPaymentIntent, handleWebhook } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
export async function paymentRoutes(fastify) {
    fastify.post('/intent', {
        preHandler: requireAuth,
        schema: {
            body: {
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
                        clientSecret: { type: 'string' },
                        orderId: { type: 'string' },
                        amount: { type: 'number' },
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
    }, createPaymentIntent);
    fastify.post('/webhook', {
        schema: {
            body: {
                type: 'string',
            },
            headers: {
                type: 'object',
                properties: {
                    'stripe-signature': { type: 'string' },
                },
                required: ['stripe-signature'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        received: { type: 'boolean' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, handleWebhook);
}
