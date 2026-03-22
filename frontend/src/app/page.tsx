'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const { assignments, setAssignments } = useAppStore();

  useEffect(() => {
    api.getAssignments().then(setAssignments).catch(console.error);
  }, []);

  const totalQuestions = assignments.reduce(
    (s, a) => s + (a.paper?.sections?.reduce((ss, sec) => ss + sec.questions.length, 0) ?? 0),
    0
  );
  const subjects = new Set(assignments.map((a) => a.subject));

  return (
    <>
      <Topbar
        title={
          <>
            <LayoutGrid className="w-4 h-4" />
            Home
          </>
        }
        showBack={false}
      />

      <main className="flex-1 px-4 pt-2 pb-8 lg:px-6 overflow-x-hidden">
        
        <div className="hidden lg:block mb-7 pt-1">
          <h1 className="flex items-center gap-3 text-text-primary" style={{ fontSize: 26, fontWeight: 900 }}>
            <span className="w-3 h-3 bg-easy rounded-full" />
            Dashboard
          </h1>
          <p className="text-text-secondary mt-1.5" style={{ fontSize: 16, fontWeight: 400 }}>Welcome back, John Doe!</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-6">
          {[
            { label: 'Assignments', value: assignments.length },
            { label: 'Questions', value: totalQuestions },
            { label: 'Subjects', value: subjects.size },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card rounded-2xl p-4 sm:p-6">
              <p className="text-text-muted mb-2" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </p>
              <p className="text-text-primary leading-none" style={{ fontSize: 42, fontWeight: 900 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Recent assignments */}
        <div className="glass-card rounded-2xl p-5 sm:p-7">
          <h2 className="text-text-primary mb-5" style={{ fontSize: 20, fontWeight: 800 }}>Recent Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-text-secondary" style={{ fontSize: 15 }}>
              No assignments yet.{' '}
              <Link href="/assignments/create" className="text-orange hover:underline" style={{ fontWeight: 700 }}>
                Create your first one!
              </Link>
            </p>
          ) : (
            <div>
              {assignments.slice(0, 5).map((a) => (
                <div
                  key={a._id}
                  className="hover-overlay flex justify-between items-center py-4 border-b border-border-default last:border-0 cursor-pointer -mx-3 px-3 rounded-xl transition-colors"
                  onClick={() => router.push(`/assignments/${a._id}`)}
                >
                  <div>
                    <p className="text-text-primary" style={{ fontSize: 15, fontWeight: 700 }}>{a.title}</p>
                    <p className="text-text-muted mt-0.5" style={{ fontSize: 13, fontWeight: 500 }}>Due: {a.due}</p>
                  </div>
                  <span className="text-orange" style={{ fontSize: 14, fontWeight: 700 }}>View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
