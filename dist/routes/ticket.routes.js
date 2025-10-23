import {} from 'fastify';
import { getTicketsByUser, getTicketByCode, scanTicket } from '../controllers/tickets.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
export async function ticketRoutes(fastify) {
    fastify.get('/my-tickets', {
        preHandler: requireAuth,
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            ticketCode: { type: 'string' },
                            qrData: { type: 'string' },
                            isScanned: { type: 'boolean' },
                            scannedAt: { type: 'string' },
                            issuedAt: { type: 'string' },
                            seat: { type: 'object' },
                            order: { type: 'object' },
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
    }, getTicketsByUser);
    fastify.get('/:code', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                },
                required: ['code'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        ticketCode: { type: 'string' },
                        qrData: { type: 'string' },
                        isScanned: { type: 'boolean' },
                        scannedAt: { type: 'string' },
                        issuedAt: { type: 'string' },
                        seat: { type: 'object' },
                        order: { type: 'object' },
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
    }, getTicketByCode);
    fastify.post('/:code/scan', {
        preHandler: requireAuth,
        schema: {
            params: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                },
                required: ['code'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        ticket: { type: 'object' },
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
    }, scanTicket);
}
