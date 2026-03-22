/**
 * Assignment routes.
 *
 * POST /             — create assignment + enqueue BullMQ job
 * GET  /             — list all assignments (no paper field)
 * GET  /:id          — get one assignment (paper served from Redis cache if available)
 * GET  /:id/status   — lightweight status poll (used as WS fallback)
 * POST /:id/regenerate — reset & re-enqueue
 * DELETE /:id        — delete from MongoDB + clear Redis cache
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { Assignment } from '../models/Assignment';
import { getQueue, getRedis } from '../services/queueService';
import { extractTextFromBuffer } from '../services/fileService';
import { renderPaperPdf, type PdfVariant } from '../services/pdfService';
import { AssignmentFormData } from '../types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|jpg|jpeg|png)$/i) !== null);
  },
});

const router = Router();
const MAX_EXTRACTED_FILE_CHARS = 30_000;
const MAX_TOTAL_QUESTIONS = 60;

// ── GET /api/assignments ─────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-paper')
      .lean();
    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error('[Route] List assignments:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// ── GET /api/assignments/:id ─────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Serve paper from Redis cache when available (avoids large MongoDB reads)
    const cached = await getRedis()
      .get(`paper:${req.params.id}`)
      .catch(() => null);

    if (cached) {
      const assignment = await Assignment.findById(req.params.id)
        .select('-paper')
        .lean();
      if (assignment) {
        return res.json({
          success: true,
          data: { ...assignment, paper: JSON.parse(cached) },
        });
      }
    }

    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error('[Route] Get assignment:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
});

// ── GET /api/assignments/:id/status  (lightweight polling fallback) ───────────
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .select('status jobId lastError updatedAt')
      .lean();
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

// ── GET /api/assignments/:id/pdf  (server-side PDF) ───────────────────────────
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const variant = (req.query.variant as PdfVariant) || 'both';
    if (!['paper', 'key', 'both'].includes(variant)) {
      return res.status(400).json({ success: false, error: 'Invalid variant' });
    }

    // Try cache first to avoid large MongoDB reads
    const cached = await getRedis()
      .get(`paper:${req.params.id}`)
      .catch(() => null);

    let assignment: any | null = null;
    let paper: any | null = null;
    if (cached) {
      assignment = await Assignment.findById(req.params.id).select('-paper').lean();
      paper = JSON.parse(cached);
    } else {
      assignment = await Assignment.findById(req.params.id).lean();
      paper = assignment?.paper ?? null;
    }

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    if (!paper) {
      return res.status(400).json({ success: false, error: 'Paper not generated yet' });
    }

    const buf = await renderPaperPdf(paper, variant, assignment.title);
    const safeBase = String(assignment.title || 'assignment').replace(/[^a-z0-9]/gi, '-');
    const filename =
      variant === 'paper'
        ? `${safeBase}-question-paper.pdf`
        : variant === 'key'
          ? `${safeBase}-answer-key.pdf`
          : `${safeBase}-paper-with-key.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error('[Route] PDF:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// ── POST /api/assignments ────────────────────────────────────────────────────
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Support JSON and multipart/form-data reliably
    let formData: AssignmentFormData | undefined;
    const candidate = (req.body as any)?.formData ?? req.body;
    if (typeof candidate === 'string') {
      // Some clients send formData as a JSON string even outside multipart
      formData = JSON.parse(candidate) as AssignmentFormData;
    } else if (candidate && typeof candidate === 'object') {
      // Multer provides fields as strings in multipart; parse if needed
      if (typeof (candidate as any).formData === 'string') {
        formData = JSON.parse((candidate as any).formData) as AssignmentFormData;
      } else {
        formData = candidate as AssignmentFormData;
      }
    }

    if (!formData?.subject || !formData?.grade || !formData?.topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, grade, topic',
      });
    }
    if (!formData.questionTypes?.length) {
      return res.status(400).json({
        success: false,
        error: 'At least one question type is required',
      });
    }
    const totalQuestions = formData.questionTypes.reduce((s, qt) => s + (Number(qt.count) || 0), 0);
    if (totalQuestions > MAX_TOTAL_QUESTIONS) {
      return res.status(400).json({
        success: false,
        error: `Too many questions requested (${totalQuestions}). Max allowed is ${MAX_TOTAL_QUESTIONS}.`,
      });
    }

    // Extract text from uploaded file if present
    if (req.file) {
      const extracted = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      if (extracted) {
        formData.fileContent = extracted.length > MAX_EXTRACTED_FILE_CHARS
          ? extracted.slice(0, MAX_EXTRACTED_FILE_CHARS) +
              `\n\n[Truncated: original length ${extracted.length} chars]`
          : extracted;
        formData.fileName = req.file.originalname;
        console.log(`[Route] Extracted ${formData.fileContent.length} chars from "${req.file.originalname}"`);
      } else {
        console.log(`[Route] File "${req.file.originalname}" uploaded but no text extracted (image or unsupported)`);
      }
    }

    const assignedOn   = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const dueFormatted = formData.due
      ? new Date(formData.due).toLocaleDateString('en-GB').replace(/\//g, '-')
      : assignedOn;

    // 1. Persist assignment in MongoDB (status: pending)
    const assignment = await Assignment.create({
      title:      `${formData.subject} – ${formData.topic}`,
      subject:    formData.subject,
      grade:      formData.grade,
      topic:      formData.topic,
      assignedOn,
      due:        dueFormatted,
      status:     'pending',
      formData,
    });

    const assignmentId = assignment._id.toString();

    // 2. Enqueue job in BullMQ (Redis-backed)
    const jobId = uuidv4();
    const job   = await getQueue().add(
      'generate',
      { assignmentId, formData },
      { jobId },
    );

    // 3. Store jobId on the assignment
    await Assignment.findByIdAndUpdate(assignmentId, { jobId: job.id });

    console.log(`[Route] Assignment ${assignmentId} created → BullMQ job ${job.id}`);

    res.status(201).json({
      success: true,
      data: { assignmentId, jobId: job.id },
    });
  } catch (err) {
    console.error('[Route] Create assignment:', err);
    res.status(500).json({ success: false, error: 'Failed to create assignment' });
  }
});

// ── POST /api/assignments/:id/regenerate ─────────────────────────────────────
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // Clear cached paper
    await getRedis().del(`paper:${req.params.id}`).catch(() => {});

    // Reset status
    await Assignment.findByIdAndUpdate(req.params.id, {
      status: 'pending',
      paper:  undefined,
      jobId:  undefined,
      lastError: undefined,
    });

    // Re-enqueue
    const jobId = uuidv4();
    const previousQuestions =
      assignment.paper?.sections
        ?.flatMap((s: any) => s.questions?.map((q: any) => String(q.text || '').trim()).filter(Boolean) ?? [])
        ?.slice(0, 40) ?? [];

    const job   = await getQueue().add(
      'generate',
      {
        assignmentId: req.params.id,
        formData: {
          ...(assignment.formData as any),
          variationSeed: uuidv4(),
          avoidQuestions: previousQuestions,
        },
      },
      { jobId },
    );

    await Assignment.findByIdAndUpdate(req.params.id, { jobId: job.id });

    console.log(`[Route] Assignment ${req.params.id} re-queued → BullMQ job ${job.id}`);

    res.json({ success: true, data: { assignmentId: req.params.id, jobId: job.id } });
  } catch (err) {
    console.error('[Route] Regenerate assignment:', err);
    res.status(500).json({ success: false, error: 'Failed to queue regeneration' });
  }
});

// ── DELETE /api/assignments/:id ──────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await getRedis().del(`paper:${req.params.id}`).catch(() => {});
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete assignment' });
  }
});

export default router;
