export const validate = (validator) => {
    return (request, reply) => {
        const { valid, errors } = validator(request.body);
        if (!valid) {
            reply.code(400).send({ error: 'Validation failed', details: errors });
        }
    };
};
// General validation middleware
export async function validationMiddleware(request, reply) {
    // This is handled by Fastify's built-in schema validation
    // This function can be used for custom validation logic if needed
    return;
}
