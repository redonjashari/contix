// src/utils/logger.util.ts
// Central logger config using pino.
// - Exports a named `logger` and default export
// - Exports getLogger(bindings) to create child loggers
// - Exports makeFastifyLogger() to pass into Fastify()
// - Exports registerRequestLogger(fastify) to attach a request-scoped child logger
import pino, {} from 'pino';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'development' ? 'debug' : 'info');
function createLogger() {
    if (NODE_ENV === 'development') {
        return pino({
            level: LOG_LEVEL,
            base: { pid: false },
            timestamp: pino.stdTimeFunctions.isoTime,
            formatters: {
                level(label) {
                    return { level: label };
                },
            },
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    translateTime: 'SYS:standard',
                    singleLine: false,
                },
            },
        });
    }
    return pino({
        level: LOG_LEVEL,
        timestamp: pino.stdTimeFunctions.isoTime,
    });
}
/** Named export used by your error.middleware.ts: `import { logger } from '../utils/logger.util.js'` */
export const logger = createLogger();
/** Default export (same logger) */
export default logger;
/** Create or return a child logger with bindings (useful inside services) */
export function getLogger(bindings) {
    return bindings ? logger.child(bindings) : logger;
}
/** Provide a logger object that can be passed directly to Fastify({ logger }) */
export function makeFastifyLogger() {
    if (NODE_ENV === 'development') {
        return {
            level: LOG_LEVEL,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    translateTime: 'SYS:standard',
                    singleLine: false,
                },
            },
        };
    }
    return {
        level: LOG_LEVEL,
    };
}
/**
 * Attach a request-scoped child logger to each incoming request.
 * Usage: registerRequestLogger(fastify) in app bootstrap.
 *
 * The function attaches `request.log` (Fastify already has request.log when Fastify has logger enabled),
 * but this also creates a child with useful bindings (reqId, method, url, userId if present).
 */
export function registerRequestLogger(fastify) {
    // fastify.addHook is synchronous-friendly here
    fastify.addHook('onRequest', (request, _reply, done) => {
        try {
            const baseBindings = {
                reqId: request.id,
                method: request.method,
                url: request.url,
            };
            // If your auth middleware attaches user to request (request.user), include it
            // We typecast to any because FastifyRequest may not have user typed
            const anyReq = request;
            if (anyReq.user && anyReq.user.id) {
                baseBindings.userId = anyReq.user.id;
            }
            // Create a child logger and attach to request (and reply for convenience)
            const reqLogger = logger.child(baseBindings);
            // Fastify normally exposes request.log when a logger was provided to Fastify constructor,
            // but we explicitly set it to ensure availability.
            request.log = reqLogger;
        }
        catch (err) {
            // If something fails here we still want request to continue
            logger.warn({ err }, 'Failed to create request-scoped logger');
        }
        done();
    });
}
