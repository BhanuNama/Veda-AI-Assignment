import Groq from 'groq-sdk';
import { z } from 'zod';
import { config } from '../config';
import { AssignmentFormData, QuestionPaper } from '../types';

let _client: Groq | null = null;

function getClient(): Groq {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  if (!_client) {
    _client = new Groq({ apiKey: config.groqApiKey });
  }
  return _client;
}

function buildPrompt(formData: AssignmentFormData): string {
  const totalMarks = formData.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );

  const qtDesc = formData.questionTypes
    .map(
      (qt, i) =>
        `  ${i + 1}. ${qt.count} x ${qt.type} — ${qt.marks} mark${qt.marks > 1 ? 's' : ''} each`
    )
    .join('\n');

  const referenceSection = formData.fileContent
    ? `\nREFERENCE MATERIAL (from uploaded file: "${formData.fileName || 'document'}"):
"""
${formData.fileContent}
"""
Use the above reference material to generate specific, contextually accurate questions drawn directly from this content. Prioritise concepts, facts, definitions, and examples found in the reference.`
    : '';

  const regenSection =
    formData.variationSeed || (formData.avoidQuestions && formData.avoidQuestions.length)
      ? `\nREGENERATION MODE:\n- Variation seed: ${formData.variationSeed || 'n/a'}\n- You MUST generate a meaningfully different paper (different questions, different wording, different examples) while keeping the same specs.\n${
          formData.avoidQuestions?.length
            ? `- Do NOT repeat or paraphrase these previous questions:\n${formData.avoidQuestions
                .slice(0, 40)
                .map((q, i) => `  ${i + 1}. ${q}`)
                .join('\n')}\n`
            : ''
        }`
      : '';

  const blueprintSection = formData.blueprint?.enabled
    ? `\nASSESSMENT BLUEPRINT (MUST FOLLOW):\n` +
      `- Difficulty distribution (%): Easy ${formData.blueprint.difficulty?.easy ?? 30}, Moderate ${formData.blueprint.difficulty?.moderate ?? 40}, Hard ${formData.blueprint.difficulty?.hard ?? 30}\n` +
      (formData.blueprint.topics?.length
        ? `- Topic weightage (%):\n${formData.blueprint.topics
            .map((t) => `  - ${t.name}: ${t.weight}%`)
            .join('\n')}\n`
        : `- Topic weightage (%): ${formData.topic} = 100%\n`) +
      `\nFor EACH question, you MUST include meta fields:\n` +
      `- meta.topic: one of the blueprint topics (or the main topic)\n` +
      `Your final paper MUST be close to the target distributions.`
    : '';

  return `You are an expert curriculum designer for CBSE/ICSE schools. Generate a complete, educationally rigorous question paper.

PAPER SPECIFICATIONS:
- School: Delhi Public School, Sector-4, Bokaro
- Subject: ${formData.subject}
- Class/Grade: ${formData.grade}
- Chapter/Topic: ${formData.topic}
- Time Allowed: ${formData.time} minutes
- Maximum Marks: ${totalMarks}
${formData.instructions ? `- Special Instructions: ${formData.instructions}` : ''}
${referenceSection}
${regenSection}
REQUIRED QUESTION TYPES:
${qtDesc}

DIFFICULTY TARGET: Easy ~30%, Moderate ~40%, Hard ~30%
${blueprintSection}

OUTPUT: Return ONLY valid JSON — NO markdown fences, NO commentary, NO text outside the JSON object.

EXACT JSON STRUCTURE:
{
  "schoolName": "Delhi Public School, Sector-4, Bokaro",
  "subject": "${formData.subject}",
  "grade": "${formData.grade}",
  "topic": "${formData.topic}",
  "timeAllowed": ${formData.time},
  "maxMarks": ${totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "type": "Multiple Choice Questions",
      "questions": [
        {
          "text": "Complete question text here?",
          "difficulty": "Easy",
          "marks": 1,
          "options": ["(A) Option one", "(B) Option two", "(C) Option three", "(D) Option four"]
        }
      ]
    }
  ],
  "answerKey": [
    {
      "qNum": 1,
      "sectionTitle": "Section A",
      "answer": "Comprehensive model answer with explanation"
    }
  ]
}

STRICT RULES:
1. One section per question type; label sections Section A, B, C, etc.
2. MCQ questions MUST have exactly 4 options in "options" array. All other types have empty "options": []
3. Difficulty must be exactly "Easy", "Moderate", or "Hard" (case-sensitive)
4. answerKey must list EVERY question in order, numbered sequentially across ALL sections
5. All questions must be specific, accurate, and curriculum-aligned for the topic
6. Questions should test different cognitive levels: recall, application, analysis
7. Do NOT include any text outside the JSON`;
}

const DifficultySchema = z.enum(['Easy', 'Moderate', 'Hard']);

const QuestionSchema = z.object({
  text: z.string().min(1),
  difficulty: DifficultySchema,
  marks: z.number().int().positive(),
  options: z.array(z.string()),
  meta: z
    .object({
      topic: z.string().min(1).optional(),
    })
    .optional(),
});

const SectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  type: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

const AnswerKeyItemSchema = z.object({
  qNum: z.number().int().positive(),
  sectionTitle: z.string().min(1),
  answer: z.string().min(1),
});

const QuestionPaperSchema = z.object({
  schoolName: z.string().min(1),
  subject: z.string().min(1),
  grade: z.string().min(1),
  topic: z.string().min(1),
  timeAllowed: z.number().int().positive(),
  maxMarks: z.number().int().positive(),
  sections: z.array(SectionSchema).min(1),
  answerKey: z.array(AnswerKeyItemSchema).min(1),
});

function normalizeAndValidatePaper(raw: string): QuestionPaper {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  const paper = QuestionPaperSchema.parse(parsed) as QuestionPaper;

  // Extra invariants beyond the base schema
  let expectedQ = 1;
  const keyNums = new Set<number>();
  for (const sec of paper.sections) {
    const isMCQ = sec.type.toLowerCase().includes('multiple choice');
    for (const q of sec.questions) {
      if (isMCQ && q.options.length !== 4) {
        throw new Error(`Invalid MCQ options: "${sec.title}" questions must have exactly 4 options`);
      }
      if (!isMCQ && q.options.length !== 0) {
        throw new Error(`Invalid options: "${sec.title}" non-MCQ questions must have empty options []`);
      }
      expectedQ++;
    }
  }

  for (const ak of paper.answerKey) keyNums.add(ak.qNum);

  const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);
  if (keyNums.size !== totalQuestions) {
    throw new Error(`Invalid answerKey: expected ${totalQuestions} items, got ${keyNums.size}`);
  }
  for (let i = 1; i <= totalQuestions; i++) {
    if (!keyNums.has(i)) throw new Error(`Invalid answerKey: missing qNum ${i}`);
  }

  return paper;
}

export async function generateQuestionPaper(
  formData: AssignmentFormData
): Promise<QuestionPaper> {
  const client = getClient();
  const prompt = buildPrompt(formData);

  const call = async (messages: Array<{ role: 'user' | 'system'; content: string }>) => {
    const completion = await client.chat.completions.create({
      model: config.groqModel,
      messages,
      max_tokens: 8000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0]?.message?.content ?? '';
  };

  // Attempt 1: normal generation. Attempt 2-3: repair with explicit error context.
  let lastRaw = '';
  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw =
        attempt === 1
          ? await call([{ role: 'user', content: prompt }])
          : await call([
              {
                role: 'system',
                content:
                  'You are fixing a JSON object to match a strict schema. Return ONLY valid JSON. No markdown, no commentary.',
              },
              {
                role: 'user',
                content:
                  `The previous JSON failed validation with this error:\n${lastError}\n\n` +
                  `Fix the JSON below to satisfy the schema and rules (MCQ options=4, non-MCQ options=[]; answerKey covers all questions in order).\n\n` +
                  `JSON:\n${lastRaw}`,
              },
            ]);

      lastRaw = raw;
      const paper = normalizeAndValidatePaper(raw);
      return paper;
    } catch (err) {
      lastError =
        err instanceof z.ZodError
          ? err.issues.map((e: z.ZodIssue) => e.message).join('; ')
          : (err as Error).message;
      if (!lastRaw) lastRaw = '';
      if (attempt === 3) throw new Error(`AI output validation failed after retries: ${lastError}`);
    }
  }

  throw new Error('AI output validation failed');
}

export function generateFallbackPaper(formData: AssignmentFormData): QuestionPaper {
  const totalMarks = formData.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );
  const diffs: Array<'Easy' | 'Moderate' | 'Hard'> = ['Easy', 'Moderate', 'Hard'];

  const sections = formData.questionTypes.map((qt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const isMCQ = qt.type.toLowerCase().includes('multiple choice');
    const questions = Array.from({ length: qt.count }, (_, i) => ({
      text: `Explain the key concept of ${formData.topic} as it relates to ${formData.subject}. (Question ${i + 1})`,
      difficulty: diffs[i % 3],
      marks: qt.marks,
      options: isMCQ
        ? [
            `(A) First option related to ${formData.topic}`,
            `(B) Second option related to ${formData.topic}`,
            `(C) Third option related to ${formData.topic}`,
            `(D) Fourth option related to ${formData.topic}`,
          ]
        : [],
    }));

    return {
      title: `Section ${letter}`,
      instruction: `Attempt all questions. Each question carries ${qt.marks} mark${qt.marks > 1 ? 's' : ''}.`,
      type: qt.type,
      questions,
    };
  });

  let qNum = 1;
  const answerKey = sections.flatMap((sec) =>
    sec.questions.map(() => ({
      qNum: qNum++,
      sectionTitle: sec.title,
      answer: `Model answer for question ${qNum - 1}: Sample answer for ${formData.topic}.`,
    }))
  );

  return {
    schoolName: 'Delhi Public School, Sector-4, Bokaro',
    subject: formData.subject,
    grade: formData.grade,
    topic: formData.topic,
    timeAllowed: Number(formData.time),
    maxMarks: totalMarks,
    sections,
    answerKey,
  };
}
