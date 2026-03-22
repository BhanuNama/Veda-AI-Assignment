'use client';

import { X, Minus, Plus, ChevronDown } from 'lucide-react';
import { QuestionTypeInput } from '@/types';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Answer Questions',
  'Long Answer Questions',
  'True / False',
  'Fill in the Blanks',
  'Diagram-based Questions',
  'Case Study Questions',
  'Numerical Problems',
];

function optionLabel(t: string) {
  if (t === 'Short Answer Questions') return 'Short Questions';
  if (t === 'Diagram-based Questions') return 'Diagram/Graph-Based Questions';
  return t;
}

function PillStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center gap-0 rounded-full bg-[#F3F4F6] px-1 py-1 dark:bg-[#3f3f46]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#4B5563] transition-colors hover:bg-white dark:text-neutral-300 dark:hover:bg-[#52525b]"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <span
        className="min-w-[2rem] text-center tabular-nums text-[#171717] dark:text-white"
        style={{ fontSize: 15, fontWeight: 700 }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#4B5563] transition-colors hover:bg-white dark:text-neutral-300 dark:hover:bg-[#52525b]"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** Mobile ref: white pill stepper on light inset */
function MobileWhiteStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="inline-flex w-full max-w-[9.5rem] items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-0.5 py-0.5 shadow-sm dark:border-neutral-600 dark:bg-[#fafafa]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#333] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-800 dark:hover:bg-neutral-200"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span
        className="min-w-[2.25rem] flex-1 text-center tabular-nums text-[#333] dark:text-neutral-900"
        style={{ fontSize: 16, fontWeight: 700 }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#333] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-800 dark:hover:bg-neutral-200"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

interface QuestionTypeRowProps {
  qt: QuestionTypeInput;
  index: number;
  onChange: (index: number, updated: QuestionTypeInput) => void;
  onRemove: (index: number) => void;
  isLast?: boolean;
}

/** Desktop: table row. Mobile: stacked white card (reference). */
export function QuestionTypeRow({ qt, index, onChange, onRemove, isLast }: QuestionTypeRowProps) {
  const update = (field: keyof QuestionTypeInput, value: string | number) =>
    onChange(index, { ...qt, [field]: value });

  const selectOptions = QUESTION_TYPES.map((t) => (
    <option key={t} value={t}>
      {optionLabel(t)}
    </option>
  ));

  return (
    <div className="mb-3 last:mb-0 sm:mb-0">
      {/* Mobile — white card, inset gray controls, white steppers */}
      <div className="rounded-[28px] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:bg-[#27272a] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] sm:hidden">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <select
              value={qt.type}
              onChange={(e) => update('type', e.target.value)}
              className="w-full cursor-pointer appearance-none truncate rounded-lg border-0 bg-transparent py-1.5 pl-0 pr-7 text-[15px] font-bold text-[#333] outline-none dark:text-neutral-100"
            >
              {selectOptions}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 text-[#333] opacity-70 dark:text-neutral-300"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#374151] dark:hover:bg-[#52525b] dark:hover:text-white"
            aria-label="Remove row"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="rounded-2xl bg-[#EFEFEF] p-4 dark:bg-[#3f3f46]">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <span className="text-center text-[12px] font-bold text-[#333] dark:text-neutral-200">No. of Questions</span>
              <MobileWhiteStepper value={qt.count} onChange={(v) => update('count', v)} min={1} />
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2">
              <span className="text-center text-[12px] font-bold text-[#333] dark:text-neutral-200">Marks</span>
              <MobileWhiteStepper value={qt.marks} onChange={(v) => update('marks', Math.max(1, v))} min={1} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop — table row */}
      <div
        className={`hidden min-w-0 flex-wrap items-center gap-2 border-[#E8E8E8] py-3 dark:border-neutral-600 sm:flex sm:flex-nowrap sm:gap-3 ${
          isLast ? 'border-b-0' : 'border-b'
        }`}
      >
        <select
          value={qt.type}
          onChange={(e) => update('type', e.target.value)}
          className="min-h-[44px] min-w-0 flex-1 cursor-pointer rounded-full border border-[#E8E8E8] bg-[#F7F7F7] px-4 py-2.5 text-[#171717] outline-none dark:border-neutral-600 dark:bg-[#27272a] dark:text-white sm:basis-[40%]"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          {selectOptions}
        </select>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#374151] dark:hover:bg-[#52525b] dark:hover:text-white"
          aria-label="Remove row"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="flex flex-1 items-center justify-center">
          <PillStepper value={qt.count} onChange={(v) => update('count', v)} min={1} />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <PillStepper value={qt.marks} onChange={(v) => update('marks', Math.max(1, v))} min={1} />
        </div>
      </div>
    </div>
  );
}
