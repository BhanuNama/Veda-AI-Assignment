/**
 * Core job processor — runs inside the BullMQ worker.
 *
 * Responsibilities:
 *  1. Mark assignment as 'generating' in MongoDB
 *  2. Emit real-time progress via WebSocket (job:step × 4)
 *  3. Call Claude API (via aiService) to generate the question paper
 *  4. Save completed paper to MongoDB
 *  5. Cache paper in Redis (24-hour TTL) for fast subsequent reads
 *  6. Broadcast job:completed (or job:failed) via WebSocket
 */

import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from './aiService';
import { getRedis } from './queueService';
import { broadcast } from '../websocket/wsManager';
import { AssignmentFormData, JOB_STEPS } from '../types';

const STEP_LABELS = [
  'Processing assignment details',
  'Structuring question sections',
  'Calibrating difficulty levels',
  'Generating answer key',
] as const;

const PAPER_CACHE_TTL_SECONDS = 86_400; // 24 h

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function processJob(
  jobId: string,
  assignmentId: string,
  formData: AssignmentFormData,
): Promise<void> {
  const sendStep = (stepIndex: number) =>
    broadcast(jobId, {
      event: 'job:step',
      data: {
        jobId,
        assignmentId,
        step: JOB_STEPS[stepIndex],
        stepIndex,
        totalSteps: JOB_STEPS.length,
        label: STEP_LABELS[stepIndex],
      },
    });

  try {
    // ── Step 0: mark as generating ───────────────────────────────────────
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'generating',
      jobId,
      lastError: undefined,
    });
    sendStep(0);
    await delay(600);

    // ── Step 1: structuring prompt ───────────────────────────────────────
    sendStep(1);
    await delay(500);

    // ── Step 2: AI call ──────────────────────────────────────────────────
    sendStep(2);
    const paper = await generateQuestionPaper(formData);

    // Compute blueprint metadata (difficulty + topics coverage)
    const questions = paper.sections.flatMap((s) => s.questions);
    const difficultyCounts = { easy: 0, moderate: 0, hard: 0 };
    const topicsSet = new Set<string>();

    for (const q of questions) {
      if (q.difficulty === 'Easy') difficultyCounts.easy += 1;
      if (q.difficulty === 'Moderate') difficultyCounts.moderate += 1;
      if (q.difficulty === 'Hard') difficultyCounts.hard += 1;

      if (q.meta?.topic) topicsSet.add(q.meta.topic);
    }

    const topicsCovered = Array.from(topicsSet).slice(0, 30);

    const blueprint = formData.blueprint?.enabled ? formData.blueprint : undefined;
    const pct = (n: number, d: number) => (d <= 0 ? 0 : Math.round((n / d) * 100));
    const totalQ = questions.length || 1;

    const actualDiffPct = {
      easy: pct(difficultyCounts.easy, totalQ),
      moderate: pct(difficultyCounts.moderate, totalQ),
      hard: pct(difficultyCounts.hard, totalQ),
    };

    const scoreParts: number[] = [];
    if (blueprint?.difficulty) {
      scoreParts.push(
        100 -
          Math.min(
            100,
            (Math.abs(actualDiffPct.easy - (blueprint.difficulty.easy ?? actualDiffPct.easy)) +
              Math.abs(actualDiffPct.moderate - (blueprint.difficulty.moderate ?? actualDiffPct.moderate)) +
              Math.abs(actualDiffPct.hard - (blueprint.difficulty.hard ?? actualDiffPct.hard))) /
              3
          )
      );
    }
    const coverageScore = scoreParts.length ? Math.round(scoreParts.reduce((a, b) => a + b, 0) / scoreParts.length) : undefined;

    // ── Step 3: persisting ───────────────────────────────────────────────
    sendStep(3);
    await delay(400);

    // Save to MongoDB
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      paper,
      blueprintMeta: {
        topicsCovered,
        difficultyCounts,
        coverageScore,
      },
      lastError: undefined,
    });

    // Cache in Redis for fast reads
    await getRedis()
      .set(
        `paper:${assignmentId}`,
        JSON.stringify(paper),
        'EX',
        PAPER_CACHE_TTL_SECONDS,
      )
      .catch((err) => console.warn('[Job] Redis cache write failed:', err.message));

    // ── Notify frontend ──────────────────────────────────────────────────
    broadcast(jobId, {
      event: 'job:completed',
      data: { jobId, assignmentId, paper },
    });

    console.log(`[Job] ✓ ${jobId} — assignment ${assignmentId} completed`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[Job] ✗ ${jobId} failed:`, error);

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed', lastError: error }).catch(
      () => {},
    );

    broadcast(jobId, {
      event: 'job:failed',
      data: { jobId, assignmentId, error },
    });

    throw err; // BullMQ re-queues for retry on throw
  }
}
