import {} from 'fastify';
import { getCurrentUser, updateCurrentUser } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
export async function userRoutes(fastify) {
    fastify.get('/me', {
        preHandler: requireAuth,
        schema: {
            response: {
                200: {
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
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, getCurrentUser);
    fastify.put('/me', {
        preHandler: requireAuth,
        schema: {
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                        isVerified: { type: 'boolean' },
                        updatedAt: { type: 'string' },
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
    }, updateCurrentUser);
}
