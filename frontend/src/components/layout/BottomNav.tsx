'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LayoutGrid, FileText, Library, Sparkles, Plus } from 'lucide-react';
/** Matches reference: Home, Assignments, Library, AI Toolkit (no Groups in tab bar). */
const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/toolkit', label: 'AI Toolkit', icon: Sparkles },
] as const;

const CAPSULE_H = 88; // px — taller pill for touch + visual weight

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const fabBottom = `calc(${CAPSULE_H}px + env(safe-area-inset-bottom, 0px) + 28px)`;

  /** List page uses a centered black pill from AssignmentGrid — avoid duplicate FAB. */
  const hideCornerFab = pathname === '/assignments';

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => router.push('/assignments/create')}
        className={clsx('lg:hidden fixed z-50 fixed-gpu right-5', hideCornerFab && 'hidden')}
        style={{ bottom: fabBottom }}
        aria-label="Create assignment"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          style={{
            background: 'var(--glass-card-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 28px var(--glass-card-shad), 0 1px 0 rgba(255,255,255,0.08) inset',
            border: '1px solid var(--glass-card-border)',
          }}
        >
          <Plus style={{ width: 22, height: 22, color: '#E05A2B', strokeWidth: 2.5 }} />
        </div>
      </button>

      {/* Floating capsule nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 fixed-gpu pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="pointer-events-auto mx-3 mb-3 flex min-h-[88px] items-center justify-between rounded-full px-2 py-2.5"
          style={{
            backgroundColor: '#000000',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const muted = '#6B6B6B';
            const on = '#FFFFFF';
            return (
              <Link
                key={href}
                href={href}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-1 py-1 transition-colors duration-200"
              >
                <Icon
                  className="shrink-0 transition-colors duration-200"
                  style={{
                    width: 24,
                    height: 24,
                    strokeWidth: active ? 2.35 : 2,
                    color: active ? on : muted,
                  }}
                  aria-hidden
                />
                <span
                  className="max-w-full truncate text-center leading-none transition-colors duration-200"
                  style={{
                    fontSize: 11,
                    fontWeight: active ? 600 : 500,
                    color: active ? on : muted,
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
