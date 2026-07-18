import { Queue, Worker, Job } from 'bullmq';
import sendEmail from '../utils/sendEmail.js';
import logger from './logger.js';

const REDIS_URL = process.env.REDIS_URL;

export let emailQueue: Queue | null = null;
export let emailWorker: Worker | null = null;
export let queueInitialized = false;

if (REDIS_URL) {
  try {
    const connectionOptions = {
      connection: {
        url: REDIS_URL
      }
    };

    emailQueue = new Queue('emailQueue', connectionOptions);

    emailWorker = new Worker('emailQueue', async (job: Job) => {
      const { email, subject, message, html } = job.data;
      logger.info(`Processing background email job for ${email}...`);
      await sendEmail({ email, subject, message, html });
    }, connectionOptions);

    emailWorker.on('completed', (job) => {
      logger.info(`Email job ${job.id} completed successfully`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`Email job ${job?.id} failed:`, err);
    });

    queueInitialized = true;
    logger.info('BullMQ email queue and worker initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize BullMQ. Falling back to direct email sending:', error);
  }
} else {
  logger.info('REDIS_URL not configured. Running email queues in fallback (synchronous) mode.');
}

/**
 * Add email sending task to queue, or send directly if queue is inactive
 */
export const addEmailJob = async (email: string, subject: string, message: string, html?: string): Promise<void> => {
  if (queueInitialized && emailQueue) {
    await emailQueue.add('sendEmail', { email, subject, message, html }, { attempts: 3, backoff: 5000 });
    logger.info(`Email queued in background for ${email}`);
  } else {
    // Synchronous fallback
    logger.info(`Dispatching email synchronously for ${email}`);
    await sendEmail({ email, subject, message, html });
  }
};
