'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment } from '@/types';

interface Props {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

const CARD_SHADOW =
  'shadow-[0_8px_32px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]';
const MENU_SHADOW = 'shadow-[0_12px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]';

export function AssignmentCard({ assignment, onDelete }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={`relative min-h-[128px] cursor-pointer select-none rounded-2xl border-0 bg-[var(--glass-card-bg)] px-4 pb-5 pt-5 transition-shadow duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] active:scale-[0.99] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)] ${CARD_SHADOW}`}
      onClick={() => router.push(`/assignments/${assignment._id}`)}
    >
      <div ref={menuRef} className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Assignment actions"
        >
          <MoreVertical style={{ width: 16, height: 16 }} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
              role="menu"
              className={`absolute right-0 top-9 z-30 min-w-[156px] overflow-hidden rounded-xl border-0 bg-[var(--glass-card-bg)] py-1 ${MENU_SHADOW}`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/assignments/${assignment._id}`);
                }}
                className="w-full px-3.5 py-2 text-left text-text-primary transition-colors hover:bg-surface"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                View Assignment
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(assignment._id);
                }}
                className="w-full px-3.5 py-2 text-left text-red-500 transition-colors hover:bg-red-500/10"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex min-h-[76px] flex-col justify-between gap-5 pr-9">
        <h3 className="leading-snug text-text-primary" style={{ fontSize: 15, fontWeight: 800 }}>
          {assignment.title}
        </h3>

        <div className="flex items-end justify-between gap-2 text-text-secondary" style={{ fontSize: 12 }}>
          <span>
            <span className="text-text-primary" style={{ fontWeight: 600 }}>
              Assigned on:{' '}
            </span>
            <span style={{ fontWeight: 400 }}>{assignment.assignedOn}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="text-text-primary" style={{ fontWeight: 600 }}>
              Due:{' '}
            </span>
            <span style={{ fontWeight: 400 }}>{assignment.due}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
