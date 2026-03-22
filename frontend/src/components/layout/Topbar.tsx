'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface TopbarProps {
  title: ReactNode;
  showBack?: boolean;
  backHref?: string;
  /** Mobile (&lt;lg): row with optional back (left) + this title centered — replaces duplicate page headings. */
  mobileCenterTitle?: ReactNode;
}

export function Topbar({ title, showBack = true, backHref, mobileCenterTitle }: TopbarProps) {
  const router = useRouter();
  const showMobileRow = mobileCenterTitle != null;

  return (
    <>
      {showMobileRow && (
        <div className="w-full shrink-0 px-4 lg:hidden">
          {showBack ? (
            <div className="grid min-h-[44px] w-full grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1 pb-2 pt-0.5">
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => (backHref ? router.push(backHref) : router.back())}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[#1A1A1A] transition-colors active:scale-[0.97] dark:bg-white/[0.12] dark:text-white"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
              <h1 className="min-w-0 truncate text-center text-[17px] font-extrabold leading-tight text-[#1A1A1A] dark:text-white">
                {mobileCenterTitle}
              </h1>
              <div className="w-10 shrink-0" aria-hidden />
            </div>
          ) : (
            <div className="flex min-h-[44px] w-full items-center justify-center pb-2 pt-0.5">
              <h1 className="max-w-full truncate text-center text-[17px] font-extrabold leading-tight text-[#1A1A1A] dark:text-white">
                {mobileCenterTitle}
              </h1>
            </div>
          )}
        </div>
      )}

      {/* 340px main offset + 16px inset ≈ 356px */}
      <div className="hidden lg:block fixed top-4 left-[356px] right-4 z-30">
        <div className="glass-panel figma-panel flex items-center h-[68px] px-6 gap-3 rounded-[16px] transition-all duration-300">

        {showBack && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="hover-overlay w-10 h-10 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 text-[#6B6B6B] dark:text-text-secondary"
          >
            <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0 text-[15px] font-medium text-[#6B6B6B] dark:text-text-secondary">
          {title}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Bell */}
          <button
            type="button"
            className="hover-overlay relative w-10 h-10 flex items-center justify-center rounded-full transition-colors text-[#6B6B6B] dark:text-text-secondary"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF4D4D]" />
          </button>

          {/* User chip */}
          <div
            className="hover-overlay flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-xl transition-colors"
          >
            <UserAvatar size={36} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)' }}>
              John Doe
            </span>
            <ChevronDown style={{ width: 13, height: 13, color: 'var(--c-text-muted)' }} />
          </div>
        </div>
      </div>
      </div>
      {/* Spacer to prevent content from overlapping fixed topbar (68px + mt-4 + mb-3) */}
      <div className="hidden lg:block h-[96px] flex-shrink-0" aria-hidden />
    </>
  );
}
