'use client';

import { useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { EmptyState } from '@/components/assignments/EmptyState';
import { AssignmentGrid } from '@/components/assignments/AssignmentGrid';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';

export default function AssignmentsPage() {
  const { assignments, setAssignments } = useAppStore();

  useEffect(() => {
    api.getAssignments().then(setAssignments).catch(console.error);
  }, []);

  return (
    <>
      <Topbar
        title="Assignment"
        showBack
        backHref="/"
        mobileCenterTitle="Assignments"
      />

      <main className="flex flex-1 flex-col min-h-0 min-w-0 px-4 pt-1 pb-8 lg:px-6 lg:pt-2">
        {assignments.length > 0 && (
          <div className="mb-5 hidden pt-0.5 lg:block">
            <h1 className="flex items-center gap-2.5 text-text-primary" style={{ fontSize: 22, fontWeight: 900 }}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-easy" aria-hidden />
              Assignments
            </h1>
            <p className="mt-1 text-text-secondary" style={{ fontSize: 14, fontWeight: 400 }}>
              Manage and create assignments for your classes.
            </p>
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center min-h-0 w-full">
            <EmptyState />
          </div>
        ) : (
          <AssignmentGrid assignments={assignments} />
        )}
      </main>
    </>
  );
}
