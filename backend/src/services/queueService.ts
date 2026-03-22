/**
 * Redis + BullMQ bootstrap.
 *
 * Redis is a REQUIRED service. The app exits on startup if it cannot connect.
 * Two IORedis clients are created:
 *   - _redis    : general-purpose (caching, misc key-value ops)
 *   - _bullRedis: dedicated BullMQ connection (maxRetriesPerRequest: null)
 *
 * BullMQ v5 cannot share an IORedis instance with non-BullMQ code because
 * it requires maxRetriesPerRequest:null while general Redis clients need
 * maxRetriesPerRequest:1 for sensible timeout behaviour.
 */

import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config';

// ── General-purpose Redis client ────────────────────────────────────────────
let _redis: IORedis;

export function getRedis(): IORedis {
  return _redis;
}

// ── BullMQ Queue ─────────────────────────────────────────────────────────────
let _queue: Queue;

export function getQueue(): Queue {
  return _queue;
}

// ── Connection helper ────────────────────────────────────────────────────────
/** Supports redis:// and rediss:// (TLS — e.g. Upstash, Redis Cloud). */
export function parseRedisUrl(url: string): {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db?: number;
  tls?: Record<string, never>;
} {
  try {
    const u = new URL(url);
    const useTls = u.protocol === 'rediss:';
    const dbPath =
      u.pathname && u.pathname !== '/' && !Number.isNaN(Number(u.pathname.slice(1)))
        ? Number(u.pathname.slice(1))
        : undefined;
    return {
      host: u.hostname || 'localhost',
      port: u.port ? Number(u.port) : 6379,
      ...(u.username ? { username: decodeURIComponent(u.username) } : {}),
      ...(u.password ? { password: decodeURIComponent(u.password) } : {}),
      ...(dbPath !== undefined ? { db: dbPath } : {}),
      ...(useTls ? { tls: {} } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
export async function connectRedis(): Promise<void> {
  const connOpts = parseRedisUrl(config.redisUrl);

  // 1. General client (used for caching, etc.)
  _redis = new IORedis({
    ...connOpts,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 5_000,
    lazyConnect: true,
  });

  _redis.on('error', (err) =>
    console.error('[Redis] Client error:', err.message),
  );

  await _redis.connect();
  await _redis.ping(); // throws if unreachable → caught in bootstrap → process.exit
  console.log('[Redis] Connected ✓');

  // 2. BullMQ Queue (requires maxRetriesPerRequest: null per BullMQ v5 spec)
  _queue = new Queue('paper-generation', {
    connection: { ...connOpts, maxRetriesPerRequest: null, enableReadyCheck: false },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: { count: 100 },
      removeOnFail:     { count: 100 },
    },
  });

  // Confirm queue is reachable
  await _queue.waitUntilReady();
  console.log('[BullMQ] Queue "paper-generation" ready ✓');
}
