import type { FastifyRequest } from 'fastify';


export interface AuthenticatedUser {
id: string;
email: string;
role?: string;
}


export interface AuthenticatedRequest<T = unknown> extends FastifyRequest {
user?: AuthenticatedUser;
body: T;
}