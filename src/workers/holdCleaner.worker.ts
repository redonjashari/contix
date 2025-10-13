import { SeatService } from '../services/seat.service';
import { env } from '../config/env';
import { logger } from '../utils/logger.util';

const seatService = new SeatService();

/**
 * Background worker that periodically releases expired holds.
 * 
 * This worker ensures that seats held by users who don't complete
 * payment within the TTL are returned to available status.
 * 
 * Runs every minute (configurable via HOLD_CLEANUP_INTERVAL).
 */
export class HoldCleanerWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      logger.warn('Hold cleaner worker is already running');
      return;
    }

    const interval = parseInt(env.HOLD_CLEANUP_INTERVAL || '60000');

    logger.info(`Starting hold cleaner worker (interval: ${interval}ms)`);

    // Run immediately on start
    this.runCleanup();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, interval);

    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info('Hold cleaner worker stopped');
    }
  }

  private async runCleanup() {
    try {
      const startTime = Date.now();
      const released = await seatService.releaseExpiredHolds();
      const duration = Date.now() - startTime;

      if (released > 0) {
        logger.info(`Released ${released} expired holds (took ${duration}ms)`);
      }
    } catch (error: any) {
      logger.error('Error in hold cleaner:', error);
    }
  }
}

// Auto-start if run directly
if (require.main === module) {
  const worker = new HoldCleanerWorker();
  worker.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down worker...');
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down worker...');
    worker.stop();
    process.exit(0);
  });
}