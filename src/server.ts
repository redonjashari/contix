import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.util.js';

async function start() {
  try {
    const app = await buildApp();
    
    const address = await app.listen({
      port: parseInt(env.PORT),
      host: '0.0.0.0',
    });
    
    logger.info(`Server listening at ${address}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
