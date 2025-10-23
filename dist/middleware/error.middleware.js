import { logger } from '../utils/logger.util.js';
export async function errorHandler(error, request, reply) {
    // Log error
    logger.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
    }, 'Request error:');
    // Prisma errors
    if (error.message.includes('Unique constraint')) {
        return reply.code(409).send({
            error: 'Conflict',
            message: 'Resource already exists',
        });
    }
    if (error.message.includes('Foreign key constraint')) {
        return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid reference',
        });
    }
    // JWT errors
    if (error.message.includes('jwt') || error.message.includes('token')) {
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
    // Validation errors
    if (error.validation) {
        return reply.code(400).send({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: error.validation,
        });
    }
    // Default error
    const statusCode = error.statusCode || 500;
    reply.code(statusCode).send({
        error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
        message: statusCode >= 500 ? 'Something went wrong' : error.message,
    });
}
