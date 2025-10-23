import type { FastifyReply, FastifyRequest } from 'fastify';

export type ValidatorFn = (payload: any) => { valid: boolean; errors?: any };

export const validate = (validator: ValidatorFn) => {
  return (request: FastifyRequest, reply: FastifyReply) => {
    const { valid, errors } = validator(request.body);
    if (!valid) {
      reply.code(400).send({ error: 'Validation failed', details: errors });
    }
  };
};

// General validation middleware
export async function validationMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // This is handled by Fastify's built-in schema validation
  // This function can be used for custom validation logic if needed
  return;
}