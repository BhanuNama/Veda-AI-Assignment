'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, BookMarked, GraduationCap, Calendar, Clock, FileText, Plus, Sparkles, SlidersHorizontal, Tags, Target, Mic, MicOff } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { QuestionTypeRow } from './QuestionTypeRow';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { AssignmentFormData, QuestionTypeInput } from '@/types';
import { DayPicker } from 'react-day-picker';
import { format, isValid, parseISO } from 'date-fns';

const defaultQuestionTypes: QuestionTypeInput[] = [
  { type: 'Multiple Choice Questions', count: 4, marks: 1 },
  { type: 'Short Answer Questions', count: 3, marks: 2 },
  { type: 'Diagram-based Questions', count: 5, marks: 5 },
  { type: 'Numerical Problems', count: 5, marks: 5 },
];

const pillInput =
  'w-full rounded-full border border-[#E8E8E8] bg-[#F7F7F7] px-5 py-3 text-[15px] text-[#171717] outline-none transition-[border,box-shadow] focus:border-[#C4C4C4] dark:border-neutral-600 dark:bg-[#27272a] dark:text-white';

const pillInputSm =
  'w-full rounded-full border border-[#E8E8E8] bg-[#F7F7F7] px-4 py-2.5 text-[15px] text-[#171717] outline-none transition-[border,box-shadow] focus:border-[#C4C4C4] dark:border-neutral-600 dark:bg-[#27272a] dark:text-white';

export function CreateForm() {
  const router = useRouter();
  const { addAssignment, addToast, setPendingJob } = useAppStore();

  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [dueOpen, setDueOpen] = useState(false);
  const [time, setTime] = useState(45);
  const [instructions, setInstructions] = useState('');
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeInput[]>(defaultQuestionTypes);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const dueRef = useRef<HTMLDivElement | null>(null);

  const [listening, setListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  const startDictation = () => {
    setSttError(null);
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSttError('Mic transcription is not supported in this browser.');
      return;
    }
    const recog = new SR();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = true;

    let finalText = '';
    recog.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      const combined = (finalText + (interim ? ` ${interim}` : '')).trim();
      setInstructions((prev) => {
        const base = prev?.trim();
        if (!base) return combined;
        // Avoid repeating the whole string on interim updates: only append when final grows.
        if (combined.length <= base.length) return base;
        return combined;
      });
    };
    recog.onerror = (e: any) => {
      setSttError(e?.error ? String(e.error) : 'Mic transcription failed.');
      setListening(false);
    };
    recog.onend = () => {
      setListening(false);
    };

    try {
      setListening(true);
      recog.start();
      // stop function stored on window to allow toggle
      (w.__vedaStopRecog = () => {
        try { recog.stop(); } catch {}
      });
    } catch (err) {
      setSttError((err as Error).message);
      setListening(false);
    }
  };

  const stopDictation = () => {
    const w = window as any;
    try {
      if (typeof w.__vedaStopRecog === 'function') w.__vedaStopRecog();
    } finally {
      setListening(false);
    }
  };

  const [blueprintEnabled, setBlueprintEnabled] = useState(false);
  const [difficultyPct, setDifficultyPct] = useState({ easy: 30, moderate: 40, hard: 30 });
  const [topicWeights, setTopicWeights] = useState<Array<{ name: string; weight: number }>>([]);

  const normalizeTo100 = (vals: Record<string, number>) => {
    const keys = Object.keys(vals);
    const raw = keys.map((k) => Math.max(0, Number(vals[k] ?? 0)));
    const sum = raw.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
      const even = Math.floor(100 / keys.length);
      const out: Record<string, number> = {};
      keys.forEach((k, i) => (out[k] = even + (i === 0 ? 100 - even * keys.length : 0)));
      return out;
    }
    const scaled = raw.map((v) => (v / sum) * 100);
    const rounded = scaled.map((v) => Math.floor(v));
    let rem = 100 - rounded.reduce((a, b) => a + b, 0);
    // distribute remainder to largest fractional parts
    const fracs = scaled.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
    for (let j = 0; j < fracs.length && rem > 0; j++) {
      rounded[fracs[j].i] += 1;
      rem -= 1;
      if (j === fracs.length - 1) j = -1;
    }
    const out: Record<string, number> = {};
    keys.forEach((k, idx) => (out[k] = rounded[idx]));
    return out;
  };

  const dueDate = useMemo(() => {
    try {
      const d = parseISO(due);
      return isValid(d) ? d : new Date();
    } catch {
      return new Date();
    }
  }, [due]);

  const addQuestionType = () => {
    const usedTypes = questionTypes.map((q) => q.type);
    const allTypes = [
      'Multiple Choice Questions',
      'Short Answer Questions',
      'Long Answer Questions',
      'True / False',
      'Fill in the Blanks',
      'Diagram-based Questions',
      'Case Study Questions',
      'Numerical Problems',
    ];
    const next = allTypes.find((t) => !usedTypes.includes(t)) || allTypes[0];
    setQuestionTypes((prev) => [...prev, { type: next, count: 3, marks: 1 }]);
  };

  const updateQuestionType = (index: number, updated: QuestionTypeInput) => {
    setQuestionTypes((prev) => prev.map((qt, i) => (i === index ? updated : qt)));
  };

  const removeQuestionType = (index: number) => {
    setQuestionTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): string | null => {
    if (!subject.trim()) return 'Please enter a subject.';
    if (!grade.trim()) return 'Please enter a class/grade.';
    if (!topic.trim()) return 'Please enter a chapter/topic.';
    if (!due) return 'Please select a due date.';
    if (questionTypes.length === 0) return 'Please add at least one question type.';
    for (const qt of questionTypes) {
      if (qt.count < 1) return 'Question count must be at least 1.';
      if (qt.marks < 1) return 'Marks must be at least 1.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) { addToast(error, 'error'); return; }

    const formData: AssignmentFormData = {
      subject: subject.trim(),
      grade: grade.trim(),
      topic: topic.trim(),
      due,
      time: Number(time),
      instructions: instructions.trim() || undefined,
      questionTypes,
    };

    if (blueprintEnabled) {
      const topicsBase =
        topicWeights.length > 0
          ? topicWeights
          : [{ name: topic.trim() || 'Topic', weight: 100 }];

      const diff = normalizeTo100(difficultyPct) as any;
      const topicsNorm = normalizeTo100(
        Object.fromEntries(
          topicsBase
            .filter((t) => t.name.trim())
            .map((t, idx) => [`${idx}:${t.name.trim()}`, t.weight])
        )
      );

      const topics = Object.entries(topicsNorm).map(([k, w]) => ({
        name: k.split(':').slice(1).join(':'),
        weight: w,
      }));

      formData.blueprint = {
        enabled: true,
        difficulty: { easy: diff.easy ?? 0, moderate: diff.moderate ?? 0, hard: diff.hard ?? 0 },
        topics,
      };
    }

    setLoading(true);
    try {
      const { assignmentId, jobId } = await api.createAssignment(formData, selectedFile);

      // Optimistically add to store
      addAssignment({
        _id: assignmentId,
        title: `${formData.subject} – ${formData.topic}`,
        subject: formData.subject,
        grade: formData.grade,
        topic: formData.topic,
        assignedOn: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        due: new Date(due).toLocaleDateString('en-GB').replace(/\//g, '-'),
        status: 'generating',
        formData,
        jobId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setPendingJob({ assignmentId, jobId });
      router.push(`/assignments/${assignmentId}`);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to create assignment.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);
  const totalQuestions = questionTypes.reduce((s, qt) => s + qt.count, 0);

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-w-0 max-w-full"
    >
      {/* Progress — reference: dark segment + light track */}
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E5E5] sm:mb-6 dark:bg-neutral-700">
        <div className="h-full w-1/2 rounded-full bg-[#525252] transition-all dark:bg-neutral-400" />
      </div>

      <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#E8E8E8] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:p-8 dark:border-neutral-700 dark:bg-[#18181b] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        <div className="mb-6 text-left">
          <h2 className="text-[#171717] dark:text-white" style={{ fontSize: 20, fontWeight: 800 }}>
            Assignment Details
          </h2>
          <p className="mt-1 text-[#737373] dark:text-neutral-400" style={{ fontSize: 14, fontWeight: 400 }}>
            Basic information about your assignment
          </p>
        </div>

        {/* File upload */}
        <div className="mb-6">
          <FileUpload onFileSelect={(f) => setSelectedFile(f)} />
          {selectedFile && (
            <p className="mt-2 text-center text-[12px] font-semibold text-[#525252] dark:text-neutral-300">
              ✓ AI will use &quot;{selectedFile.name}&quot; as reference material
            </p>
          )}
        </div>

        {/* Subject */}
        <div className="mb-5">
          <label
            className="mb-2 flex items-center gap-2 text-[#404040] dark:text-neutral-200"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <BookOpen className="h-4 w-4 text-[#6B7280]" />
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Science, Mathematics, English"
            className={pillInput}
          />
        </div>

        {/* Grade + Topic */}
        <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 flex items-center gap-2 text-[#404040] dark:text-neutral-200"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              <GraduationCap className="h-4 w-4 text-[#6B7280]" />
              Class / Grade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. Grade 8, Class 10"
              className={pillInput}
            />
          </div>
          <div>
            <label
              className="mb-2 flex items-center gap-2 text-[#404040] dark:text-neutral-200"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              <BookMarked className="h-4 w-4 text-[#6B7280]" />
              Chapter / Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Electricity, Photosynthesis"
              className={pillInput}
            />
          </div>
        </div>

        {/* Due date + Time */}
        <div className="mb-6 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              className="mb-2 flex items-center gap-2 text-[#404040] dark:text-neutral-200"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              <Calendar className="h-4 w-4 text-[#6B7280]" />
              Due Date <span className="text-red-500">*</span>
            </label>
            <div
              className="relative"
              ref={dueRef}
              onBlur={(e) => {
                if (!dueRef.current?.contains(e.relatedTarget as Node | null)) {
                  setDueOpen(false);
                }
              }}
            >
              <button
                type="button"
                onClick={() => setDueOpen((v) => !v)}
                className={`${pillInput} flex w-full items-center justify-between text-left font-semibold hover:bg-[#F0F0F0] dark:hover:bg-[#3f3f46]`}
              >
                <span className={due ? 'text-[#171717] dark:text-white' : 'text-[#9CA3AF] dark:text-neutral-500'}>
                  {due ? format(dueDate, 'dd-MM-yyyy') : 'DD-MM-YYYY'}
                </span>
                <Calendar className="h-5 w-5 shrink-0 text-[#6B7280]" strokeWidth={1.75} />
              </button>

              {dueOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#E8E8E8] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:border-neutral-600 dark:bg-[#27272a] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                  <DayPicker
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => {
                      if (!d) return;
                      const iso = format(d, 'yyyy-MM-dd');
                      setDue(iso);
                      setDueOpen(false);
                    }}
                    weekStartsOn={1}
                    disabled={{ before: new Date() }}
                    classNames={{
                      months: 'w-full',
                      month: 'w-full',
                      caption: 'flex items-center justify-between mb-3',
                      caption_label: 'text-text-primary font-extrabold',
                      nav: 'flex items-center gap-2',
                      nav_button:
                        'w-8 h-8 rounded-xl flex items-center justify-center hover-overlay transition-colors',
                      table: 'w-full border-collapse',
                      head_row: '',
                      head_cell: 'text-center text-text-muted text-[11px] font-semibold py-2',
                      row: '',
                      cell: 'p-0 text-center align-middle',
                      day: 'text-text-primary',
                      day_button:
                        'w-10 h-10 rounded-xl inline-flex items-center justify-center text-[12px] font-semibold hover-overlay transition-colors',
                      day_selected: 'bg-[#E5E7EB] font-extrabold dark:bg-neutral-600',
                      day_today: 'ring-1 ring-[#9CA3AF] dark:ring-neutral-500',
                      day_outside: 'opacity-30',
                      day_disabled: 'opacity-30',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="sm:col-span-2 sm:max-w-md">
            <label
              className="mb-2 flex items-center gap-2 text-[#404040] dark:text-neutral-200"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              <Clock className="h-4 w-4 text-[#6B7280]" />
              Time Allowed (minutes)
            </label>
            <input
              type="number"
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              min={1}
              max={300}
              className={pillInput}
            />
          </div>
        </div>

        {/* Question types — mobile: stacked cards on gray; desktop: table */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[#404040] dark:text-neutral-200 sm:hidden" style={{ fontSize: 14, fontWeight: 700 }}>
              Question Type
            </span>
            <span className="hidden text-[#404040] dark:text-neutral-200 sm:inline" style={{ fontSize: 14, fontWeight: 700 }}>
              Question configuration
            </span>
            {totalQuestions > 0 && (
              <span
                className="hidden text-[#737373] dark:text-neutral-400 sm:inline"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {totalQuestions} questions · {totalMarks} marks total
              </span>
            )}
          </div>

          <div className="max-sm:rounded-2xl max-sm:bg-[#F5F5F5] max-sm:p-3 max-sm:dark:bg-[#1c1c1f]">
            <div className="rounded-2xl border border-[#E8E8E8] bg-[#F5F5F5] px-3 py-1 dark:border-neutral-600 dark:bg-[#27272a] max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:dark:bg-transparent sm:px-4">
              <div className="mb-1 hidden items-center gap-2 border-b border-[#E5E7EB] pb-2 pt-1 text-sm font-bold text-[#404040] dark:border-neutral-600 dark:text-neutral-300 sm:flex sm:gap-3">
                <span className="min-w-0 flex-1 pl-1 sm:basis-[40%]">Question Type</span>
                <span className="w-9 shrink-0" aria-hidden />
                <span className="flex-1 text-center">No. of Questions</span>
                <span className="flex-1 text-center">Marks</span>
              </div>

              {questionTypes.map((qt, i) => (
                <QuestionTypeRow
                  key={i}
                  qt={qt}
                  index={i}
                  isLast={i === questionTypes.length - 1}
                  onChange={updateQuestionType}
                  onRemove={removeQuestionType}
                />
              ))}
            </div>
          </div>

          {totalQuestions > 0 && (
            <div className="mt-4 flex flex-col items-end gap-1 text-[14px] text-[#404040] dark:text-neutral-300 sm:hidden">
              <span>
                Total Questions :{' '}
                <span className="font-bold text-[#171717] dark:text-white">{totalQuestions}</span>
              </span>
              <span>
                Total Marks :{' '}
                <span className="font-bold text-[#171717] dark:text-white">{totalMarks}</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={addQuestionType}
            className="mt-4 flex items-center gap-3 rounded-full py-1 text-[#404040] transition-colors hover:opacity-90 dark:text-neutral-200 sm:mt-3 sm:gap-2 sm:px-4 sm:py-2 sm:hover:bg-[#F3F4F6] dark:sm:hover:bg-[#3f3f46]"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171717] text-white dark:bg-neutral-200 dark:text-neutral-900 sm:hidden">
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <Plus className="hidden h-4 w-4 shrink-0 sm:block" strokeWidth={2.5} />
            Add Question Type
          </button>
        </div>

        {/* Blueprint / quality controls */}
        <div className="mb-7 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#F5F5F5] dark:border-neutral-600 dark:bg-[#27272a]">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <div className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#6B7280]" />
              <div className="truncate text-[#171717] dark:text-white" style={{ fontSize: 14, fontWeight: 800 }}>
                Assessment quality controls
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBlueprintEnabled((v) => !v)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-extrabold transition-colors ${
                blueprintEnabled
                  ? 'bg-[#404040] text-white dark:bg-neutral-600'
                  : 'border border-[#E5E7EB] bg-white text-[#525252] hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#3f3f46] dark:text-neutral-200 dark:hover:bg-[#52525b]'
              }`}
            >
              {blueprintEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

          {blueprintEnabled && (
            <div className="space-y-4 border-t border-[#E5E7EB] bg-[#FAFAFA] px-4 pb-4 pt-4 dark:border-neutral-600 dark:bg-[#18181b]">
              {/* Difficulty */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 dark:border-neutral-600 dark:bg-[#27272a]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#171717] dark:text-white" style={{ fontSize: 13, fontWeight: 900 }}>
                    <Target className="h-4 w-4 text-[#6B7280]" />
                    Difficulty target (%)
                  </div>
                  <button
                    type="button"
                    onClick={() => setDifficultyPct(normalizeTo100(difficultyPct) as any)}
                    className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#525252] transition-colors hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#3f3f46] dark:text-neutral-200 dark:hover:bg-[#52525b]"
                  >
                    Normalize
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: 'easy' as const, label: 'Easy' },
                    { k: 'moderate' as const, label: 'Moderate' },
                    { k: 'hard' as const, label: 'Hard' },
                  ].map(({ k, label }) => (
                    <div key={k} className="min-w-0">
                      <div className="mb-1 text-[#737373] dark:text-neutral-400" style={{ fontSize: 12, fontWeight: 800 }}>
                        {label}
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={difficultyPct[k]}
                        onChange={(e) => setDifficultyPct((p) => ({ ...p, [k]: Number(e.target.value) }))}
                        className={pillInputSm + ' text-center'}
                        style={{ fontSize: 14, fontWeight: 800 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[#737373] dark:text-neutral-400" style={{ fontSize: 12, fontWeight: 700 }}>
                  Total: {difficultyPct.easy + difficultyPct.moderate + difficultyPct.hard}%
                </div>
              </div>

              {/* Topics */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 dark:border-neutral-600 dark:bg-[#27272a]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#171717] dark:text-white" style={{ fontSize: 13, fontWeight: 900 }}>
                    <Tags className="h-4 w-4 text-[#6B7280]" />
                    Topic weightage (%)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTopicWeights((prev) => [
                          ...prev,
                          { name: prev.length === 0 ? (topic.trim() || 'Main topic') : '', weight: prev.length === 0 ? 100 : 10 },
                        ])
                      }
                      className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#525252] transition-colors hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#3f3f46] dark:text-neutral-200 dark:hover:bg-[#52525b]"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const map = Object.fromEntries(topicWeights.map((t, idx) => [`${idx}:${t.name || 'Topic'}`, t.weight]));
                        const norm = normalizeTo100(map);
                        setTopicWeights(
                          Object.entries(norm).map(([k, weight]) => ({ name: k.split(':').slice(1).join(':'), weight }))
                        );
                      }}
                      className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#525252] transition-colors hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#3f3f46] dark:text-neutral-200 dark:hover:bg-[#52525b]"
                    >
                      Normalize
                    </button>
                  </div>
                </div>

                {topicWeights.length === 0 ? (
                  <div className="text-[#737373] dark:text-neutral-400" style={{ fontSize: 12, fontWeight: 700 }}>
                    If you don’t add sub-topics, we’ll treat the main topic as 100%.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topicWeights.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) =>
                            setTopicWeights((p) => p.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                          }
                          placeholder={idx === 0 ? (topic.trim() || 'Main topic') : 'Sub-topic'}
                          className={'flex-1 ' + pillInputSm}
                          style={{ fontSize: 14, fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={t.weight}
                          onChange={(e) =>
                            setTopicWeights((p) => p.map((x, i) => (i === idx ? { ...x, weight: Number(e.target.value) } : x)))
                          }
                          className={'w-24 ' + pillInputSm + ' text-center'}
                          style={{ fontSize: 14, fontWeight: 800 }}
                        />
                        <button
                          type="button"
                          onClick={() => setTopicWeights((p) => p.filter((_, i) => i !== idx))}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#374151] dark:hover:bg-[#52525b] dark:hover:text-white"
                          aria-label="Remove topic"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="mt-1 text-[#737373] dark:text-neutral-400" style={{ fontSize: 12, fontWeight: 700 }}>
                      Total: {topicWeights.reduce((s, x) => s + (Number(x.weight) || 0), 0)}%
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[#737373] dark:text-neutral-400" style={{ fontSize: 12, fontWeight: 700 }}>
                These targets will be enforced by guardrails and shown in the Assignment report.
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[#404040] dark:text-neutral-200" style={{ fontSize: 14, fontWeight: 700 }}>
              <FileText className="h-4 w-4 text-[#6B7280]" />
              Additional Instructions
            </label>
            <button
              type="button"
              onClick={() => (listening ? stopDictation() : startDictation())}
              title="Speak instructions"
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-extrabold transition-colors ${
                listening
                  ? 'bg-[#404040] text-white dark:bg-neutral-600'
                  : 'border border-[#E5E7EB] bg-white text-[#525252] hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#3f3f46] dark:text-neutral-200 dark:hover:bg-[#52525b]'
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? 'Stop' : 'Mic'}
            </button>
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Focus on NCERT chapters 14–15, include diagram-based questions…"
            rows={4}
            className="w-full resize-y rounded-2xl border border-[#E8E8E8] bg-[#F7F7F7] px-5 py-3.5 font-[inherit] text-[15px] text-[#171717] outline-none transition-[border,box-shadow] focus:border-[#C4C4C4] dark:border-neutral-600 dark:bg-[#27272a] dark:text-white"
          />
          {sttError && (
            <div className="mt-2" style={{ fontSize: 12, fontWeight: 700, color: '#E04B4B' }}>
              {sttError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex min-w-0 flex-col-reverse justify-stretch gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/assignments')}
            className="w-full min-w-0 sm:w-auto sm:min-w-[7rem]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="w-full min-w-0 whitespace-nowrap rounded-full border border-transparent bg-[#404040] text-sm text-white hover:bg-[#525252] dark:bg-neutral-600 dark:hover:bg-neutral-500 sm:w-auto sm:text-[15px]"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            Generate Question Paper
          </Button>
        </div>
      </div>
    </motion.form>
  );
}
