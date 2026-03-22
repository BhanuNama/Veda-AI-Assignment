'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, FileText, Clock, Plus } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, parseISO } from 'date-fns';
import { Topbar } from '@/components/layout/Topbar';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';

function parseDueToDate(due: string): Date | null {
  // Accept either "YYYY-MM-DD" or legacy "DD-MM-YYYY"
  if (!due) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    try {
      return parseISO(due);
    } catch {
      return null;
    }
  }
  const m = due.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export default function CalendarPage() {
  const { assignments, setAssignments } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  useEffect(() => {
    if (assignments.length > 0) return;
    api.getAssignments().then(setAssignments).catch(console.error);
  }, []);

  const createdDates = useMemo(() => {
    const out: Date[] = [];
    for (const a of assignments) {
      const d = new Date(a.createdAt);
      if (!Number.isNaN(d.getTime())) out.push(d);
    }
    return out;
  }, [assignments]);

  const dueDates = useMemo(() => {
    const out: Date[] = [];
    for (const a of assignments) {
      const d = parseDueToDate(a.due);
      if (d) out.push(d);
    }
    return out;
  }, [assignments]);

  const createdOnSelected = useMemo(
    () => assignments.filter((a) => isSameDay(new Date(a.createdAt), selectedDate)),
    [assignments, selectedDate]
  );

  const dueOnSelected = useMemo(
    () =>
      assignments.filter((a) => {
        const d = parseDueToDate(a.due);
        return d ? isSameDay(d, selectedDate) : false;
      }),
    [assignments, selectedDate]
  );

  return (
    <>
      <Topbar
        title={
          <>
            <CalendarIcon className="w-4 h-4" />
            Calendar
          </>
        }
        showBack={false}
      />

      <main className="flex-1 px-4 pt-2 pb-8 lg:px-6 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 lg:gap-6">
          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                Schedule
              </div>
              <Link
                href="/assignments/create"
                className="hover-overlay px-3 py-2 rounded-xl transition-colors flex items-center gap-2"
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#fff',
                  background: 'var(--c-orange)',
                }}
              >
                <Plus className="w-4 h-4" />
                New
              </Link>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--c-surface)' }}>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                weekStartsOn={1}
                modifiers={{ created: createdDates, due: dueDates }}
                classNames={{
                  months: 'w-full',
                  month: 'w-full',
                  caption: 'flex items-center justify-between mb-3',
                  caption_label: 'text-text-primary font-extrabold',
                  nav: 'flex items-center gap-2',
                  nav_button:
                    'w-9 h-9 rounded-xl flex items-center justify-center hover-overlay transition-colors',
                  table: 'w-full border-collapse',
                  head_row: '',
                  head_cell: 'text-center text-text-muted text-[11px] font-semibold py-2',
                  row: '',
                  cell: 'p-0 text-center align-middle',
                  day: 'text-text-primary',
                  day_button:
                    'w-10 h-10 rounded-xl inline-flex items-center justify-center text-[12px] font-semibold hover-overlay transition-colors',
                  day_selected: 'bg-[rgba(255,255,255,0.16)]',
                  day_today: 'ring-1 ring-orange',
                  day_outside: 'opacity-25',
                  day_disabled: 'opacity-25',
                }}
                modifiersClassNames={{
                  // Use two distinct dots: created (muted) and due (orange).
                  created:
                    'relative after:content-[\"\"] after:absolute after:bottom-[6px] after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-[var(--c-text-muted)]',
                  due:
                    'relative before:content-[\"\"] before:absolute before:bottom-[6px] before:left-1/2 before:-translate-x-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--c-orange)]',
                }}
              />
            </div>

            <div className="mt-4 flex items-center gap-3 text-text-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-orange)' }} />
                Due
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-text-muted)' }} />
                Created
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                {format(selectedDate, 'EEE, dd MMM yyyy')}
              </div>
              <div className="hidden sm:flex items-center gap-2" style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-text-muted)' }}>
                <Clock className="w-4 h-4 text-orange" />
                Quick links
              </div>
            </div>

            {createdOnSelected.length === 0 && dueOnSelected.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--c-surface)' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                  Nothing scheduled
                </div>
                <div className="mt-1" style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)' }}>
                  No created or due assignments on this date.
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {dueOnSelected.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-orange)' }} />
                      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                        Due today
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-text-muted)' }}>
                        ({dueOnSelected.length})
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {dueOnSelected.map((a) => (
                        <Link
                          key={`due-${a._id}`}
                          href={`/assignments/${a._id}`}
                          className="hover-overlay rounded-2xl p-4 transition-colors"
                          style={{ background: 'var(--c-surface)' }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: 'rgba(224,90,43,0.16)',
                                border: '1px solid rgba(224,90,43,0.22)',
                              }}
                            >
                              <FileText className="w-5 h-5" style={{ color: 'var(--c-orange)' }} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate" style={{ fontSize: 14, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                                {a.title}
                              </div>
                              <div className="mt-1" style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)' }}>
                                Due: {a.due}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {createdOnSelected.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-text-muted)' }} />
                      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                        Created today
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-text-muted)' }}>
                        ({createdOnSelected.length})
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {createdOnSelected.map((a) => (
                        <Link
                          key={`created-${a._id}`}
                          href={`/assignments/${a._id}`}
                          className="hover-overlay rounded-2xl p-4 transition-colors"
                          style={{ background: 'var(--c-surface)' }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: 'rgba(180,180,210,0.18)',
                                border: '1px solid rgba(180,180,210,0.22)',
                              }}
                            >
                              <FileText className="w-5 h-5" style={{ color: 'var(--c-text-muted)' }} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate" style={{ fontSize: 14, fontWeight: 900, color: 'var(--c-text-primary)' }}>
                                {a.title}
                              </div>
                              <div className="mt-1" style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)' }}>
                                Created
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

