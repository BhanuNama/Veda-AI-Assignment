/**
 * BullMQ Worker — consumes jobs from the 'paper-generation' queue.
 *
 * Started once at server bootstrap (after Redis is confirmed available).
 * Concurrency = 3: up to 3 papers can be generated in parallel.
 */

import { Worker } from 'bullmq';
import { config } from '../config';
import { processJob } from '../services/jobService';
import { parseRedisUrl } from '../services/queueService';
import { AssignmentFormData } from '../types';

interface JobData {
  assignmentId: string;
  formData: AssignmentFormData;
}

export function startWorker(): void {
  const worker = new Worker<JobData>(
    'paper-generation',
    async (job) => {
      console.log(`[Worker] Processing job ${job.id} for assignment ${job.data.assignmentId}`);
      await processJob(job.id!, job.data.assignmentId, job.data.formData);
    },
    {
      connection: {
        ...parseRedisUrl(config.redisUrl),
        maxRetriesPerRequest: null, // required by BullMQ v5
        enableReadyCheck: false,
      },
      concurrency: 3,
    },
  );

  worker.on('completed', (job) =>
    console.log(`[Worker] ✓ Job ${job.id} completed`),
  );

  worker.on('failed', (job, err) =>
    console.error(`[Worker] ✗ Job ${job?.id} failed (${err.message})`),
  );

  worker.on('error', (err) =>
    console.error('[Worker] Worker error:', err.message),
  );

  console.log('[Worker] BullMQ worker started — queue: paper-generation, concurrency: 3');
}
