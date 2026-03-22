'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, Filter, Plus, X,
  ArrowUpDown, CheckCircle2,
  Loader2, Clock, AlertCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/types';
import { AssignmentCard } from './AssignmentCard';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import clsx from 'clsx';

type StatusFilter = 'all' | Assignment['status'];
type SortKey = 'newest' | 'oldest' | 'az' | 'za';

const STATUS_OPTIONS: { value: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all',        label: 'All',        icon: null },
  { value: 'completed',  label: 'Ready',      icon: <CheckCircle2 style={{ width: 13, height: 13 }} /> },
  { value: 'generating', label: 'Generating', icon: <Loader2     style={{ width: 13, height: 13 }} className="animate-spin" /> },
  { value: 'pending',    label: 'Pending',    icon: <Clock        style={{ width: 13, height: 13 }} /> },
  { value: 'failed',     label: 'Failed',     icon: <AlertCircle  style={{ width: 13, height: 13 }} /> },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az',     label: 'A → Z' },
  { value: 'za',     label: 'Z → A' },
];

const STATUS_STYLE: Record<StatusFilter, string> = {
  all:        'border-transparent bg-orange text-white',
  completed:  'border-transparent bg-green-500/90 text-white',
  generating: 'border-transparent bg-blue-500/90 text-white',
  pending:    'border-transparent bg-amber-500/90 text-white',
  failed:     'border-transparent bg-red-500/90 text-white',
};
const STATUS_INACTIVE = 'border-border-default text-text-secondary hover:border-orange/60 hover:text-text-primary';

/** One wide floating bar; search sits in a nested bordered capsule inside. */
const OUTER_BAR =
  'rounded-full bg-[var(--glass-card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]';
const NESTED_SEARCH =
  'rounded-full border border-[var(--c-border)] bg-transparent dark:border-white/12';

export function AssignmentGrid({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter();
  const { removeAssignment, addToast } = useAppStore();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean))).sort(),
    [assignments]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = assignments.filter((a) => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        a.grade.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q);
      const matchStatus = status === 'all' || a.status === status;
      const matchSubject = !subjectFilter || a.subject === subjectFilter;
      return matchSearch && matchStatus && matchSubject;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'za') return b.title.localeCompare(a.title);
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === 'newest' ? db - da : da - db;
    });

    return list;
  }, [assignments, search, status, sort, subjectFilter]);

  const activeFilters = [status !== 'all' ? status : null, subjectFilter || null].filter(Boolean);

  const filterBadgeCount = activeFilters.length + (sort !== 'newest' ? 1 : 0);

  const clearAll = () => {
    setSearch('');
    setStatus('all');
    setSort('newest');
    setSubjectFilter('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteAssignment(deleteId);
      removeAssignment(deleteId);
      addToast('Assignment deleted.', 'success');
    } catch {
      addToast('Failed to delete assignment.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <div ref={toolbarRef} className="relative z-20 mb-4">
        {/* Single outer capsule: Filter By (left) + nested search pill (right) */}
        <div
          className={clsx(
            OUTER_BAR,
            'flex min-h-[48px] w-full items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2'
          )}
        >
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={clsx(
              'flex shrink-0 items-center gap-2.5 rounded-full py-2 pl-1 pr-2 text-left transition-colors sm:pl-2 sm:pr-3',
              filterOpen ? 'bg-surface/70 ring-1 ring-orange/25' : 'hover:bg-surface/50'
            )}
            aria-expanded={filterOpen}
          >
            <Filter
              className="shrink-0 text-text-muted"
              style={{ width: 18, height: 18, strokeWidth: 1.75 }}
            />
            <span className="text-text-secondary" style={{ fontSize: 14, fontWeight: 600 }}>
              Filter By
            </span>
            {filterBadgeCount > 0 && (
              <span
                className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange px-1.5 text-[10px] font-bold text-white leading-none"
                aria-label={`${filterBadgeCount} active filters`}
              >
                {filterBadgeCount}
              </span>
            )}
          </button>

          <div
            className={clsx(
              'relative ml-auto min-w-0 w-[min(13.5rem,calc(100%-5.5rem))] shrink sm:w-[15.5rem] md:w-[17.5rem]',
              NESTED_SEARCH
            )}
          >
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              style={{ width: 15, height: 15, strokeWidth: 1.75 }}
            />
            <input
              type="search"
              placeholder="Search Assignment"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-full bg-transparent py-1.5 pl-8 pr-7 text-text-primary outline-none placeholder:text-text-muted sm:h-9 sm:py-2 sm:pl-9 sm:pr-8"
              style={{ fontSize: 13, fontWeight: 500 }}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                  aria-label="Clear search"
                >
                  <X style={{ width: 13, height: 13 }} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                'absolute left-0 right-0 top-[calc(100%+8px)] rounded-2xl bg-[var(--glass-card-bg)] p-4',
                'shadow-[0_8px_32px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
                  Status
                </p>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="rounded-full p-1.5 text-text-muted hover:bg-surface hover:text-text-primary"
                  aria-label="Close filters"
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <div className="mb-5 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all',
                      status === opt.value ? STATUS_STYLE[opt.value] : STATUS_INACTIVE
                    )}
                    style={{ fontSize: 13 }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {subjects.length >= 2 && (
                <>
                  <p className="mb-2 text-text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
                    Subject
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {subjects.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubjectFilter(subjectFilter === sub ? '' : sub)}
                        className={clsx(
                          'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                          subjectFilter === sub
                            ? 'border-transparent bg-orange/15 text-orange'
                            : 'border-border-default text-text-muted hover:border-orange/40 hover:text-text-primary'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="mb-2 text-text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
                Sort
              </p>
              <div className="relative">
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSort(opt.value)}
                      className={clsx(
                        'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all',
                        sort === opt.value
                          ? 'border-orange bg-orange/10 text-orange'
                          : 'border-border-default text-text-secondary hover:border-orange/40'
                      )}
                      style={{ fontSize: 13 }}
                    >
                      <ArrowUpDown style={{ width: 14, height: 14 }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(activeFilters.length > 0 || search || sort !== 'newest') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center justify-between overflow-hidden"
          >
            <p className="text-text-muted" style={{ fontSize: 13, fontWeight: 500 }}>
              Showing{' '}
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 700 }}>{filtered.length}</span> of{' '}
              <span style={{ fontWeight: 600 }}>{assignments.length}</span> assignment
              {assignments.length !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 text-orange transition-colors hover:text-orange-light"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <X style={{ width: 13, height: 13 }} />
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={(id) => setDeleteId(id)} />
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center gap-3 py-16 text-center"
            >
              <div
                className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'var(--c-surface)' }}
              >
                <Search style={{ width: 22, height: 22, color: 'var(--c-text-muted)' }} />
              </div>
              <p className="text-text-primary" style={{ fontSize: 16, fontWeight: 700 }}>
                No assignments found
              </p>
              <p className="max-w-xs text-text-muted" style={{ fontSize: 14 }}>
                {search
                  ? `Nothing matches "${search}". Try a different keyword.`
                  : 'Try adjusting your filters or clear them to see all assignments.'}
              </p>
              {(activeFilters.length > 0 || search) && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-orange transition-colors hover:text-orange-light"
                >
                  <X style={{ width: 13, height: 13 }} /> Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB — centered; single line on narrow phones (nowrap + compact mobile sizing) */}
      <div className="fixed bottom-8 left-1/2 z-50 flex max-w-[calc(100vw-1.25rem)] -translate-x-1/2 justify-center max-lg:bottom-[calc(88px+0.75rem+16px+env(safe-area-inset-bottom,0px))] lg:left-[calc(170px+50vw)]">
        <button
          type="button"
          onClick={() => router.push('/assignments/create')}
          className="flex w-max max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-bold leading-none text-white shadow-[0_8px_28px_rgba(0,0,0,0.26)] transition-all hover:bg-[#2a2a2a] active:scale-[0.98] dark:bg-orange dark:hover:bg-orange-light sm:px-5 sm:text-sm lg:gap-2.5 lg:px-7 lg:py-3.5 lg:text-[15px]"
        >
          <Plus className="h-[15px] w-[15px] shrink-0 sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px]" strokeWidth={2.35} />
          Create Assignment
        </button>
      </div>

      <Modal
        open={!!deleteId}
        title="Delete Assignment?"
        description="This action cannot be undone. The assignment and its generated paper will be permanently removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
