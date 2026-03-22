'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, ListChecks, PieChart, Clock } from 'lucide-react';
import type { Assignment } from '@/types';

export type PaperReportStats = {
  totalQ: number;
  totalMarks: number;
  estMinutes: number;
  byDiff: { Easy: number; Moderate: number; Hard: number };
  byDiffMarks: { Easy: number; Moderate: number; Hard: number };
};

interface PaperReportModalProps {
  open: boolean;
  onClose: () => void;
  report: PaperReportStats;
  topic: string;
  blueprintMeta?: Assignment['blueprintMeta'];
}

export function PaperReportModal({
  open,
  onClose,
  report,
  topic,
  blueprintMeta,
}: PaperReportModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="paper-report-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={onClose}
          />

          <motion.div
            className="relative flex max-h-[min(92dvh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#E8E8E8] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] dark:border-neutral-700 dark:bg-[#18181b] sm:rounded-2xl sm:shadow-[0_24px_64px_rgba(0,0,0,0.2)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8E8E8] px-4 py-3 dark:border-neutral-700 sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-2">
                <Target className="h-5 w-5 shrink-0 text-orange" aria-hidden />
                <h2
                  id="paper-report-title"
                  className="truncate text-[#171717] dark:text-white"
                  style={{ fontSize: 17, fontWeight: 800 }}
                >
                  Paper Report
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-[12px] font-bold text-[#737373] dark:text-neutral-400 sm:inline">
                  Auto-generated
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#F3F4F6] dark:text-neutral-400 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <div className="mx-auto w-full max-w-xl sm:max-w-none">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4 dark:border-neutral-700 dark:bg-[#27272a]">
                    <div
                      className="mb-2 flex items-center gap-2 text-[#737373] dark:text-neutral-400"
                      style={{ fontSize: 12, fontWeight: 800 }}
                    >
                      <ListChecks className="h-4 w-4 text-orange" />
                      Total questions
                    </div>
                    <div className="text-[#171717] dark:text-white" style={{ fontSize: 28, fontWeight: 900 }}>
                      {report.totalQ}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4 dark:border-neutral-700 dark:bg-[#27272a]">
                    <div
                      className="mb-2 flex items-center gap-2 text-[#737373] dark:text-neutral-400"
                      style={{ fontSize: 12, fontWeight: 800 }}
                    >
                      <PieChart className="h-4 w-4 text-orange" />
                      Difficulty mix
                    </div>
                    <div className="space-y-1 text-[#171717] dark:text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                      <div className="flex justify-between gap-2">
                        <span>Easy</span>
                        <span className="tabular-nums">
                          {report.byDiff.Easy} ({report.byDiffMarks.Easy} marks)
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Moderate</span>
                        <span className="tabular-nums">
                          {report.byDiff.Moderate} ({report.byDiffMarks.Moderate} marks)
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Hard</span>
                        <span className="tabular-nums">
                          {report.byDiff.Hard} ({report.byDiffMarks.Hard} marks)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4 dark:border-neutral-700 dark:bg-[#27272a] sm:col-span-1">
                    <div
                      className="mb-2 flex items-center gap-2 text-[#737373] dark:text-neutral-400"
                      style={{ fontSize: 12, fontWeight: 800 }}
                    >
                      <Clock className="h-4 w-4 text-orange" />
                      Estimated time
                    </div>
                    <div className="text-[#171717] dark:text-white" style={{ fontSize: 28, fontWeight: 900 }}>
                      {report.estMinutes} min
                    </div>
                    <div className="mt-1 text-[#737373] dark:text-neutral-500" style={{ fontSize: 12, fontWeight: 600 }}>
                      Based on total marks (heuristic)
                    </div>
                  </div>
                </div>

                {blueprintMeta && (
                  <div className="mt-4 rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4 dark:border-neutral-700 dark:bg-[#27272a]">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[#171717] dark:text-white" style={{ fontSize: 13, fontWeight: 900 }}>
                        Blueprint summary
                      </div>
                      {typeof blueprintMeta.coverageScore === 'number' && (
                        <div className="text-orange" style={{ fontSize: 12, fontWeight: 900 }}>
                          {blueprintMeta.coverageScore}% match
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#E8E8E8] bg-white p-3 dark:border-neutral-600 dark:bg-[#1f1f23]">
                        <div
                          className="text-[#737373] dark:text-neutral-400"
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Topics covered
                        </div>
                        <div className="mt-1 text-[#171717] dark:text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                          {blueprintMeta.topicsCovered?.length
                            ? blueprintMeta.topicsCovered.join(', ')
                            : topic}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#E8E8E8] bg-white p-3 dark:border-neutral-600 dark:bg-[#1f1f23]">
                        <div
                          className="text-[#737373] dark:text-neutral-400"
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Difficulty counts
                        </div>
                        <div className="mt-1 space-y-0.5 text-[#171717] dark:text-white" style={{ fontSize: 12, fontWeight: 700 }}>
                          <div className="flex justify-between gap-2">
                            <span>Easy</span>
                            <span className="tabular-nums">{blueprintMeta.difficultyCounts?.easy ?? 0}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>Moderate</span>
                            <span className="tabular-nums">{blueprintMeta.difficultyCounts?.moderate ?? 0}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>Hard</span>
                            <span className="tabular-nums">{blueprintMeta.difficultyCounts?.hard ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
