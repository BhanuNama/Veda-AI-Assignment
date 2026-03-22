'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { GeneratingView } from '@/components/create/GeneratingView';
import { QuestionPaper } from '@/components/paper/QuestionPaper';
import { AnswerKey } from '@/components/paper/AnswerKey';
import { ActionBar } from '@/components/paper/ActionBar';
import { PaperReportModal } from '@/components/paper/PaperReportModal';
import { useAppStore } from '@/store/useAppStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { Assignment } from '@/types';
import { Target } from 'lucide-react';

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { assignments, pendingJob, generatingStep, addToast, setPendingJob, updateAssignmentStatus } = useAppStore();

  const [assignment, setAssignment] = useState<Assignment | null>(
    () => assignments.find((a) => a._id === id) ?? null
  );
  const [loading, setLoading] = useState(!assignment);
  const [retrying, setRetrying] = useState(false);
  const [paperReportOpen, setPaperReportOpen] = useState(false);

  // Fetch from backend if not in store
  useEffect(() => {
    if (assignment?.paper || assignment?.status === 'generating') return;

    setLoading(true);
    api
      .getAssignment(id)
      .then((data) => {
        setAssignment(data);
      })
      .catch(() => {
        addToast('Failed to load assignment.', 'error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Keep in sync with store
  useEffect(() => {
    const stored = assignments.find((a) => a._id === id);
    if (stored) setAssignment(stored);
  }, [assignments, id]);

  // WebSocket: listens when there's a pending job for this assignment
  useWebSocket((completedId) => {
    if (completedId === id) {
      api
        .getAssignment(id)
        .then(setAssignment)
        .catch(console.error);
    }
  });

  const isGenerating =
    (pendingJob?.assignmentId === id) ||
    assignment?.status === 'generating' ||
    assignment?.status === 'pending';

  const hasPaper = assignment?.status === 'completed' && assignment.paper;
  const report = (() => {
    const paper = assignment?.paper;
    if (!paper) return null;
    const questions = paper.sections.flatMap((s) => s.questions);
    const byDiff = { Easy: 0, Moderate: 0, Hard: 0 } as const;
    const byDiffMarks = { Easy: 0, Moderate: 0, Hard: 0 } as const;
    for (const q of questions) {
      (byDiff as any)[q.difficulty] = ((byDiff as any)[q.difficulty] ?? 0) + 1;
      (byDiffMarks as any)[q.difficulty] = ((byDiffMarks as any)[q.difficulty] ?? 0) + q.marks;
    }
    const totalQ = questions.length;
    const totalMarks = paper.maxMarks;
    // Very rough time estimate: 1 min per mark + 5 mins overhead, capped
    const estMinutes = Math.min(180, Math.max(10, Math.round(totalMarks * 1.0 + 5)));
    return { totalQ, totalMarks, estMinutes, byDiff, byDiffMarks };
  })();

  if (loading) {
    return (
      <>
        <Topbar title={<><FileText className="w-4 h-4" /> Assignment</>} backHref="/assignments" />
        <main className="flex-1 p-7 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-border-default border-t-orange rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!assignment) {
    return (
      <>
        <Topbar title={<><FileText className="w-4 h-4" /> Assignment</>} backHref="/assignments" />
        <main className="flex-1 p-7 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-primary text-lg font-bold mb-2">Assignment not found</p>
            <button
              onClick={() => router.push('/assignments')}
              className="text-orange text-sm font-semibold hover:underline"
            >
              ← Back to Assignments
            </button>
          </div>
        </main>
      </>
    );
  }

  if (assignment.status === 'failed') {
    return (
      <>
        <Topbar title={<><FileText className="w-4 h-4" /> Assignment</>} backHref="/assignments" />
        <main className="flex-1 p-7 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-text-primary text-lg font-bold mb-2">Generation Failed</p>
            <p className="text-sm text-text-secondary mb-5">
              {assignment.lastError ? assignment.lastError : 'Something went wrong while generating the paper.'}
            </p>
            <button
              disabled={retrying}
              onClick={async () => {
                setRetrying(true);
                try {
                  const { assignmentId, jobId } = await api.regenerateAssignment(id);
                  updateAssignmentStatus(assignmentId, 'generating');
                  setPendingJob({ assignmentId, jobId });
                  addToast('Regenerating question paper…', 'info');
                } catch (e) {
                  addToast(e instanceof Error ? e.message : 'Failed to start regeneration.', 'error');
                } finally {
                  setRetrying(false);
                }
              }}
              className="px-5 py-2.5 bg-dark dark:bg-orange text-white text-sm font-semibold rounded-full hover:bg-[#2d2d2d] dark:hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {retrying ? 'Starting…' : 'Regenerate'}
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={
          <>
            <FileText className="w-4 h-4" />
            {hasPaper ? 'Assignment' : 'Create New'}
          </>
        }
        backHref="/assignments"
      />

      <main className="flex-1 min-w-0 px-4 pt-2 pb-8 lg:px-6">
        {isGenerating && !hasPaper ? (
          <GeneratingView currentStep={generatingStep} />
        ) : hasPaper && assignment.paper ? (
          <>
            <ActionBar
              assignmentId={id}
              title={assignment.title}
            />

            {report && (
              <>
                <div className="mb-4 flex justify-stretch sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setPaperReportOpen(true)}
                    className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-[#E8E8E8] bg-[#FAFAFA] px-5 py-3 text-sm font-bold text-[#171717] shadow-sm transition-colors hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#27272a] dark:text-white dark:hover:bg-[#3f3f46] sm:w-auto"
                  >
                    <Target className="h-4 w-4 shrink-0 text-orange" aria-hidden />
                    View paper report
                  </button>
                </div>

                <PaperReportModal
                  open={paperReportOpen}
                  onClose={() => setPaperReportOpen(false)}
                  report={report}
                  topic={assignment.topic}
                  blueprintMeta={assignment.blueprintMeta}
                />
              </>
            )}

            {/* Wrapper for PDF capture — centered column */}
            <div id="question-paper-content" className="flex w-full flex-col items-center gap-5">
              <QuestionPaper paper={assignment.paper} />
              <AnswerKey items={assignment.paper.answerKey} />
            </div>
          </>
        ) : (
          <GeneratingView currentStep={generatingStep} />
        )}
      </main>
    </>
  );
}
