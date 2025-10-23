// src/controllers/auth.controller.ts
// Fastify route handlers for auth endpoints.


import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../services/auth.service.js';


export const AuthController = {
async register(request: FastifyRequest, reply: FastifyReply) {
try {
const { email, password, name } = request.body as any;
const result = await AuthService.register(email, password, name);
reply.code(201).send(result);
} catch (err: any) {
reply.code(400).send({ error: err.message });
}
},


async login(request: FastifyRequest, reply: FastifyReply) {
try {
const { email, password } = request.body as any;
const result = await AuthService.login(email, password);
reply.send(result);
} catch (err: any) {
reply.code(401).send({ error: err.message });
}
},


async refresh(request: FastifyRequest, reply: FastifyReply) {
try {
const { refreshToken } = request.body as any;
const result = await AuthService.refreshTokens(refreshToken);
reply.send(result);
} catch (err: any) {
reply.code(401).send({ error: err.message });
}
},
};