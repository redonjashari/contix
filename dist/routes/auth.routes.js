import {} from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { registerSchema, loginSchema, refreshSchema } from '../utils/validation.schemas.js';
export async function authRoutes(fastify) {
    fastify.post('/register', {
        schema: {
            body: registerSchema,
            response: {
                201: {
                    type: 'object',
                    properties: {
                        user: { type: 'object' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
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
    }, AuthController.register);
    fastify.post('/login', {
        schema: {
            body: loginSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user: { type: 'object' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
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
    }, AuthController.login);
    fastify.post('/refresh', {
        schema: {
            body: refreshSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
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
    }, AuthController.refresh);
}
