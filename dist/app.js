import Fastify, {} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { makeFastifyLogger, registerRequestLogger } from './utils/logger.util.js';
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware.js';
import { validationMiddleware } from './middleware/validation.middleware.js';
// Import routes
import { authRoutes } from './routes/auth.routes.js';
import { eventRoutes } from './routes/event.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { venueRoutes } from './routes/venue.routes.js';
import { ticketRoutes } from './routes/ticket.routes.js';
import { paymentRoutes } from './routes/payment.routes.js';
import { holdRoutes } from './routes/hold.routes.js';
import { seatRoutes } from './routes/seat.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
export async function buildApp() {
    const app = Fastify({
        logger: makeFastifyLogger(),
        disableRequestLogging: true,
    });
    // Register plugins
    await app.register(helmet, {
        contentSecurityPolicy: false,
    });
    await app.register(cors, {
        origin: env.FRONTEND_URL,
        credentials: true,
    });
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });
    // Register middleware
    app.setErrorHandler(errorHandler);
    app.addHook('preHandler', rateLimitMiddleware);
    app.addHook('preHandler', validationMiddleware);
    // Register request logging
    registerRequestLogger(app);
    // Register routes
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(eventRoutes, { prefix: '/events' });
    await app.register(orderRoutes, { prefix: '/orders' });
    await app.register(userRoutes, { prefix: '/users' });
    await app.register(venueRoutes, { prefix: '/venues' });
    await app.register(ticketRoutes, { prefix: '/tickets' });
    await app.register(paymentRoutes, { prefix: '/payments' });
    await app.register(holdRoutes, { prefix: '' });
    await app.register(seatRoutes, { prefix: '' });
    await app.register(adminRoutes, { prefix: '/admin' });
    // Health check endpoint
    app.get('/health', async (request, reply) => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    return app;
}
