import PDFDocument from 'pdfkit';
import { QuestionPaper } from '../types';

export type PdfVariant = 'paper' | 'key' | 'both';

export async function renderPaperPdf(
  paper: QuestionPaper,
  variant: PdfVariant,
  title?: string,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 48, bottom: 48, left: 48, right: 48 },
    info: { Title: title || 'Question Paper' },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const fontSize = (n: number) => doc.fontSize(n);
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentW = right - left;
  const gutter = 14;
  const qNumW = 22;
  const qIndentX = left + qNumW;
  const metaW = 110; // right-side column for marks/difficulty
  const textW = contentW - qNumW - gutter - metaW;

  const hRule = () => {
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#111111')
      .lineWidth(1)
      .stroke();
  };

  const ensureSpace = (minYDelta: number) => {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + minYDelta > bottom) doc.addPage();
  };

  const textWrap = (text: string, x: number, width: number, opts?: PDFKit.Mixins.TextOptions) => {
    doc.text(text, x, doc.y, {
      width,
      lineGap: 2,
      ...opts,
    });
  };

  // ── Header ────────────────────────────────────────────────────────────────
  fontSize(18).fillColor('#111111').font('Helvetica-Bold').text(paper.schoolName, {
    align: 'center',
  });
  doc.moveDown(0.4);
  fontSize(11).font('Helvetica').fillColor('#333333').text(`Subject: ${paper.subject}`, { align: 'center' });
  fontSize(11).text(`Class: ${paper.grade}`, { align: 'center' });
  doc.moveDown(0.9);
  hRule();
  doc.moveDown(0.8);

  // ── Meta row ──────────────────────────────────────────────────────────────
  fontSize(11).fillColor('#111111').font('Helvetica');
  doc.text(`Time Allowed: ${paper.timeAllowed} minutes`, { continued: true });
  doc.text(`Maximum Marks: ${paper.maxMarks}`, { align: 'right' });
  doc.moveDown(0.6);
  fontSize(10).fillColor('#333333').text('All questions are compulsory unless stated otherwise.', {
    oblique: true,
  } as any);
  doc.moveDown(0.9);

  // ── Student fields (Name, Roll Number, Class & Section) ────────────────────
  const startY = doc.y;
  const fieldGap = 20;
  const fieldW = (contentW - 2 * fieldGap) / 3;
  const labels = ['Name', 'Roll Number', 'Class & Section'];
  labels.forEach((l, i) => {
    const x = left + i * (fieldW + fieldGap);
    doc.font('Helvetica-Bold').fillColor('#111111').fontSize(11).text(`${l}:`, x, startY);
    const lineY = startY + 18;
    doc
      .moveTo(x, lineY)
      .lineTo(x + fieldW, lineY)
      .strokeColor('#111111')
      .lineWidth(1.5)
      .stroke();
  });
  doc.y = startY + 32;
  doc.moveDown(1.2);

  if (variant === 'paper' || variant === 'both') {
    // ── Paper body ──────────────────────────────────────────────────────────
    let globalQ = 1;
    for (const section of paper.sections) {
      ensureSpace(60);
      fontSize(14).fillColor('#111111').font('Helvetica-Bold');
      doc.text(section.title, left, doc.y, { width: contentW, align: 'center' });
      doc.moveDown(0.4);
      fontSize(10).fillColor('#333333').font('Helvetica-Oblique');
      doc.text(`${section.type} | ${section.instruction}`, left, doc.y, {
        width: contentW,
        align: 'center',
      });
      doc.moveDown(0.8);

      for (const q of section.questions) {
        ensureSpace(110);

        const startY = doc.y;

        // Question number
        fontSize(11).fillColor('#111111').font('Helvetica-Bold');
        doc.text(`${globalQ}.`, left, startY, { width: qNumW, align: 'left' });

        // Right-side meta (marks + difficulty)
        const metaText = `${q.marks} Mark${q.marks > 1 ? 's' : ''}\n${q.difficulty}`;
        fontSize(9).fillColor('#444444').font('Helvetica');
        doc.text(metaText, right - metaW, startY, { width: metaW, align: 'right', lineGap: 2 });

        // Main question text
        fontSize(11).fillColor('#111111').font('Helvetica');
        doc.y = startY;
        textWrap(q.text, qIndentX, textW);

        // Options (two columns for MCQ)
        if (q.options?.length) {
          doc.moveDown(0.35);
          const colW = (textW - gutter) / 2;
          const leftX = qIndentX;
          const rightX = qIndentX + colW + gutter;
          for (let i = 0; i < q.options.length; i += 2) {
            ensureSpace(40);
            const y = doc.y;
            fontSize(10).fillColor('#333333').font('Helvetica');
            const a = q.options[i];
            const b = q.options[i + 1];
            doc.text(a, leftX, y, { width: colW, lineGap: 2 });
            if (b) doc.text(b, rightX, y, { width: colW, lineGap: 2 });

            const hA = doc.heightOfString(a, { width: colW, lineGap: 2 });
            const hB = b ? doc.heightOfString(b, { width: colW, lineGap: 2 }) : 0;
            doc.y = y + Math.max(hA, hB) + 2;
          }
        }

        // Separator line between questions
        doc.moveDown(0.6);
        doc
          .moveTo(left, doc.y)
          .lineTo(right, doc.y)
          .strokeColor('#E6E6E6')
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.8);
        globalQ++;
      }

      doc.moveDown(0.8);
    }
  }

  if (variant === 'both') {
    doc.addPage();
  }

  if (variant === 'key' || variant === 'both') {
    // ── Answer key (full-width layout) ───────────────────────────────────────
    fontSize(15).fillColor('#111111').font('Helvetica-Bold');
    doc.text('Answer Key', left, doc.y, { width: contentW, align: 'left' });
    doc.moveDown(0.6);
    hRule();
    doc.moveDown(0.8);

    const answerTextW = contentW - qNumW - gutter;

    for (const item of paper.answerKey) {
      ensureSpace(80);
      const itemY = doc.y;
      fontSize(11).fillColor('#111111').font('Helvetica-Bold');
      doc.text(`${item.qNum}. ${item.sectionTitle}`, left, itemY, { width: contentW, align: 'left' });
      doc.moveDown(0.35);
      fontSize(10).fillColor('#111111').font('Helvetica');
      textWrap(item.answer, left + qNumW, answerTextW);
      doc.moveDown(0.8);
    }
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on('end', resolve));
  return Buffer.concat(chunks);
}

