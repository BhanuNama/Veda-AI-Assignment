/**
 * Extracts plain text from uploaded files.
 * Supported: PDF, TXT, plain text buffers.
 * Images (JPEG/PNG/WebP) are parsed via OCR (best-effort).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

const MAX_CHARS = 8_000; // keep prompt size reasonable
const OCR_TIMEOUT_MS = 18_000;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): Promise<string | null> {
  try {
    // ── PDF ──────────────────────────────────────────────────────────────────
    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      const text = data.text?.trim();
      if (!text) return null;
      return truncate(text);
    }

    // ── Plain text / markdown / doc-as-text ─────────────────────────────────
    if (
      mimetype.startsWith('text/') ||
      originalname.match(/\.(txt|md|csv)$/i)
    ) {
      return truncate(buffer.toString('utf-8').trim());
    }

    // ── Images — no OCR, skip ────────────────────────────────────────────────
    if (mimetype.startsWith('image/')) {
      const text = await withTimeout(ocrImage(buffer), OCR_TIMEOUT_MS);
      return text ? truncate(text) : null;
    }

    return null;
  } catch (err) {
    console.warn('[FileService] Text extraction failed:', (err as Error).message);
    return null;
  }
}

async function ocrImage(buffer: Buffer): Promise<string | null> {
  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {},
    });
    const text = result?.data?.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (err) {
    console.warn('[FileService] OCR failed:', (err as Error).message);
    return null;
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        t = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

function truncate(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return text.slice(0, MAX_CHARS) + '\n...[truncated]';
}
