import type { FastifyRequest, FastifyReply } from 'fastify';

// Custom rate limiting for specific endpoints
export const holdRateLimit = {
  max: 10, // 10 requests
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded for seat holds. Please try again later.',
  }),
};

export const authRateLimit = {
  max: 5, // 5 requests
  timeWindow: '5 minutes',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again later.',
  }),
};

// General rate limiting middleware
export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // This is handled by the fastify-rate-limit plugin
  // This function can be used for custom rate limiting logic if needed
  return;
}