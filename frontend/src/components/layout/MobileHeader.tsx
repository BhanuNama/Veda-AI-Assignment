'use client';

import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { VedaLogoMark } from '@/components/layout/VedaLogoMark';

export function MobileHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 fixed-gpu pointer-events-none">
      {/* Floating capsule — light: solid white on gray canvas; dark: charcoal pill */}
      <div
        className="pointer-events-auto mx-3 mt-3 flex min-h-[66px] items-center justify-between gap-3 rounded-full px-4 py-2.5 sm:px-5 sm:py-3
          bg-white shadow-[0_2px_14px_rgba(0,0,0,0.07)]
          dark:bg-[#1e1e21] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
      >
        {/* Left — VedaAI logo + wordmark on every screen */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <VedaLogoMark
            size={32}
            className="drop-shadow-[0_3px_12px_rgba(90,40,22,0.3)]"
          />
          <span
            className="truncate text-[#1A1A1A] dark:text-white"
            style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            VedaAI
          </span>
        </Link>

        {/* Right — bell (muted circle) · avatar · menu */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F0F0] transition-colors active:scale-[0.98] dark:bg-white/[0.12]"
            aria-label="Notifications"
          >
            <Bell className="h-[19px] w-[19px] text-[#1A1A1A] dark:text-white" strokeWidth={2} />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E05A2B] ring-[2.5px] ring-white dark:ring-[#1e1e21]"
              aria-hidden
            />
          </button>

          <UserAvatar size={40} className="ring-[2.5px] ring-white dark:ring-[#1e1e21]" />

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-[0.98] hover:bg-[#F0F0F0] dark:hover:bg-white/[0.08]"
            aria-label="Open menu"
            aria-haspopup="true"
          >
            <Menu className="h-[22px] w-[22px] text-[#1A1A1A] dark:text-white" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </header>
  );
}
