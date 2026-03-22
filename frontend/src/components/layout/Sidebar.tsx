'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  FileText,
  Monitor,
  BarChart2,
  Settings,
  Calendar,
  Moon,
  Sun,
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '@/store/useAppStore';
import { CountBadge } from '@/components/ui/Badge';
import { VedaLogoMark } from '@/components/layout/VedaLogoMark';

/** Filled four-point stars — larger lower-left, smaller upper-right (matches design ref). */
function CreateAssignmentStars() {
  /* Concave 4-point star: tip T → valley → tip R → valley → … */
  const d = 'M12 2 L15 10 L23 12 L15 14 L12 22 L9 14 L1 12 L9 10 Z';
  return (
    <span className="relative inline-block h-[24px] w-[44px] shrink-0 text-white" aria-hidden>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="absolute bottom-0 left-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        style={{ transform: 'rotate(-12deg)' }}
      >
        <path fill="currentColor" d={d} />
      </svg>
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        className="absolute left-[17px] top-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
        style={{ transform: 'rotate(22deg)' }}
      >
        <path fill="currentColor" d={d} />
      </svg>
    </span>
  );
}

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: FileText, badge: true },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Monitor },
  { href: '/library', label: 'My Library', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { assignments, theme, toggleTheme } = useAppStore();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-4 top-2 bottom-2 z-20 w-[308px]">
      <div className="glass-panel sidebar-floating flex flex-col flex-1 min-h-0 w-full rounded-[24px] overflow-hidden px-3.5 py-4 transition-all duration-300">

        {/* Logo — gradient squircle + wordmark (left-aligned) */}
        <div className="flex shrink-0 items-center justify-start gap-2.5 px-0.5 pb-0 pt-0.5">
          <VedaLogoMark
            size={40}
            className="drop-shadow-[0_3px_12px_rgba(90,40,22,0.28)]"
          />
          <span
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text-primary)', letterSpacing: '-0.02em' }}
          >
            VedaAI
          </span>
        </div>

        {/* Create Assignment — space below logo, full width */}
        <Link
          href="/assignments/create"
          className="group mt-8 block w-full shrink-0 rounded-full p-[5px] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: 'linear-gradient(180deg, #f08850 0%, #e05a2b 42%, #b84a22 100%)',
            boxShadow:
              '0 6px 22px rgba(224,90,43,0.34), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,210,170,0.55), inset 0 -2px 6px rgba(120,40,10,0.35)',
          }}
        >
          <span
            className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full px-5 py-2.5 text-white"
            style={{
              background: 'linear-gradient(180deg, #2c2c2c 0%, #1e1e1e 38%, #121212 72%, #0d0d0d 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.11), inset 0 -3px 10px rgba(0,0,0,0.55)',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            <CreateAssignmentStars />
            Create Assignment
          </span>
        </Link>

        {/* Nav — below create, left-aligned, larger type */}
        <nav className="mt-10 flex flex-1 min-h-0 flex-col gap-0.5 overflow-y-auto py-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150',
                  active ? 'bg-[#F2F2F2] dark:bg-white/10' : 'bg-transparent'
                )}
                style={{
                  fontSize: 16,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Icon
                  className="shrink-0 dark:stroke-[var(--c-text-muted)]"
                  style={{
                    width: 22,
                    height: 22,
                    color: active ? '#4B5563' : 'var(--c-text-muted)',
                  }}
                  strokeWidth={1.9}
                />
                <span className="min-w-0 flex-1 leading-snug">{label}</span>
                {badge && assignments.length > 0 && (
                  <CountBadge
                    count={assignments.length}
                    className="!h-[20px] !min-w-[20px] px-1.5 !text-[11px] leading-none"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-4 shrink-0 space-y-2 border-t border-[var(--c-border)] pt-4">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-secondary)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(128,128,128,0.10)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <Settings style={{ width: 20, height: 20, color: 'var(--c-text-muted)' }} strokeWidth={1.85} />
              Settings
            </button>
            <button
              type="button"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {theme === 'dark' ? <Sun size={20} strokeWidth={1.85} /> : <Moon size={20} strokeWidth={1.85} />}
            </button>
          </div>

          <div className="mt-1 flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#F2F2F2] p-3 dark:border-transparent dark:bg-[var(--c-surface)]">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{
                background: 'rgba(224,90,43,0.15)',
                border: '1.5px solid rgba(224,90,43,0.25)',
              }}
            >
              🦊
            </div>
            <div className="min-w-0">
              <div
                className="truncate"
                style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-text-primary)' }}
              >
                Delhi Public School
              </div>
              <div
                className="mt-0.5"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-muted)' }}
              >
                Bokaro Steel City
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
