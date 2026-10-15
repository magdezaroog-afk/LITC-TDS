import { Queue, Worker, Job } from 'bullmq';
import { redisManager } from './RedisClient';
import { Logger } from './Logger';
import { SlaMonitorJob } from '../../jobs/SlaMonitorJob';

const connection = redisManager.client;

if (!connection) {
  Logger.warn('[BullMQ] Redis connection not found, BullMQ will not start.');
}

export let slaQueue: Queue | null = null;
export let slaWorker: Worker | null = null;

if (connection) {
  slaQueue = new Queue('sla-monitor', { connection });
  slaWorker = new Worker('sla-monitor', async (job: Job) => {
    Logger.info(`[BullMQ Worker] Processing SLA Monitor Job ${job.id}`);
    const slaMonitor = new SlaMonitorJob();
    await slaMonitor.checkSlaBreaches();
  }, { connection });

  slaWorker.on('completed', (job) => {
    Logger.info(`[BullMQ Worker] Job ${job.id} completed successfully.`);
  });

  slaWorker.on('failed', (job, err) => {
    Logger.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err);
  });
} else {
  Logger.info('[BullMQ] Standalone mode: In-process timers will handle background SLA checks.');
}

// Setup repeatable jobs
export const initializeQueues = async () => {
  if (!connection || !slaQueue) return;

  // Run SLA monitor every 60 seconds (1 minute)
  await slaQueue.add('check-sla-breaches', {}, {
    jobId: 'sla-monitor-repeatable',
    ...({
      repeat: { pattern: '* * * * *' }
    } as any)
  });

  Logger.info('[BullMQ] Initialized repeatable jobs.');
};

