// src/middleware/auth.middleware.ts
// PreHandler for Fastify to require auth and attach request.user
import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.util.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing Authorization header' });
      return;
    }
    const token = auth.slice(7);
    const payload = verifyAccessToken(token);
    // payload contains sub, email, role
    (request as any).user = {
      id: String(payload.sub),
      email: payload.email,
      role: payload.role,
    };
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
