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