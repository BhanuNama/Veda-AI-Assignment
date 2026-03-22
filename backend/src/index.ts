/**
 * Server bootstrap.
 *
 * Required services (app exits if any fail):
 *   1. MongoDB  — stores assignments & generated papers
 *   2. Redis    — job-state storage for BullMQ, paper caching
 *   3. BullMQ   — background job queue for AI generation
 *
 * Real-time layer:
 *   4. WebSocket — pushes job:step / job:completed / job:failed to clients
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import { config } from './config';
import assignmentRoutes from './routes/assignments';
import { setupWebSocket } from './websocket/wsManager';
import { connectRedis, getRedis, getQueue } from './services/queueService';
import { startWorker } from './workers/generationWorker';

async function bootstrap(): Promise<void> {
  // ── 1. MongoDB ─────────────────────────────────────────────────────────
  await mongoose.connect(config.mongoUri);
  console.log('[MongoDB] Connected ✓');

  // ── 2. Redis + BullMQ Queue ────────────────────────────────────────────
  await connectRedis(); // throws → process.exit(1) if unavailable

  // ── 3. Express + HTTP server ───────────────────────────────────────────
  const app    = express();
  const server = http.createServer(app);

  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  // ── 4. WebSocket ───────────────────────────────────────────────────────
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWebSocket(wss);
  console.log('[WebSocket] Ready at /ws ✓');

  // ── 5. Routes ──────────────────────────────────────────────────────────
  app.use('/api/assignments', assignmentRoutes);

  app.get('/health', async (_req, res) => {
    let redisOk = false;
    let bullmqOk = false;
    try {
      await getRedis().ping();
      redisOk = true;
      const counts = await getQueue().getJobCounts();
      bullmqOk = counts !== undefined;
    } catch { /* one of the services is down */ }

    res.json({
      status: redisOk && bullmqOk ? 'ok' : 'degraded',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis:   redisOk  ? 'connected' : 'error',
      bullmq:  bullmqOk ? 'ready'     : 'error',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 6. BullMQ Worker ───────────────────────────────────────────────────
  startWorker();

  // ── 7. Listen ──────────────────────────────────────────────────────────
  server.listen(config.port, () => {
    console.log(`[Server] http://localhost:${config.port}`);
    console.log(`[Server] ws://localhost:${config.port}/ws`);
    console.log('[Server] All services ready ✓');
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err.message);
  console.error('[Server] Make sure MongoDB and Redis are running.');
  console.error('[Server]   MongoDB: mongod --dbpath /data/db');
  console.error('[Server]   Redis:   redis-server');
  process.exit(1);
});
