'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function EmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 w-full max-w-xl mx-auto">
      <div className="mb-10 shrink-0">
        <svg
          width="200"
          height="180"
          viewBox="0 0 200 180"
          fill="none"
          className="mx-auto h-auto w-[min(92vw,360px)] aspect-[200/180] sm:w-[min(88vw,400px)] lg:w-[min(92vw,440px)]"
          aria-hidden
        >
          {/* Faint circular background */}
          <circle cx="100" cy="90" r="72" fill="var(--c-surface)" />
          {/* Document */}
          <rect x="58" y="32" width="84" height="116" rx="10" fill="var(--c-card)" stroke="var(--c-border)" strokeWidth="1.5" />
          <rect x="58" y="32" width="84" height="22" rx="9" fill="var(--c-text-primary)" fillOpacity="0.15" />
          <line x1="72" y1="72" x2="128" y2="72" stroke="var(--c-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="88" x2="124" y2="88" stroke="var(--c-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="104" x2="120" y2="104" stroke="var(--c-border)" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="120" x2="116" y2="120" stroke="var(--c-border)" strokeWidth="2" strokeLinecap="round" />
          {/* Magnifying glass frame */}
          <circle cx="108" cy="88" r="36" fill="none" stroke="#9B92C7" strokeWidth="5" strokeLinecap="round" />
          <circle cx="108" cy="88" r="28" fill="var(--c-surface)" fillOpacity="0.4" stroke="#9B92C7" strokeWidth="2" />
          {/* Magnifying glass handle */}
          <path d="M132 112 L158 138" stroke="#9B92C7" strokeWidth="6" strokeLinecap="round" />
          {/* Red X inside lens */}
          <path d="M96 72 L120 96 M120 72 L96 96" stroke="#FF4D4D" strokeWidth="5" strokeLinecap="round" />
          {/* Decorative: swirl top-left */}
          <path d="M28 42 Q32 38 36 42 Q40 46 36 50" stroke="var(--c-text-muted)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          {/* Decorative: sparkle bottom-left */}
          <path d="M42 138 L44 142 L48 144 L44 146 L42 150 L40 146 L36 144 L40 142 Z" fill="var(--c-text-muted)" opacity="0.4" />
          {/* Decorative: dot bottom-right */}
          <circle cx="162" cy="142" r="5" fill="var(--c-text-muted)" opacity="0.4" />
          {/* Decorative: small UI element top-right */}
          <rect x="148" y="38" width="28" height="16" rx="4" fill="var(--c-card)" stroke="var(--c-border)" strokeWidth="1" opacity="0.8" />
          <circle cx="156" cy="46" r="3" fill="var(--c-text-muted)" opacity="0.5" />
        </svg>
      </div>

      <h2 className="text-[#1A1A1A] dark:text-text-primary mb-3" style={{ fontSize: 22, fontWeight: 800 }}>
        No assignments yet
      </h2>
      <p className="text-[#6B6B6B] dark:text-text-secondary max-w-[400px] leading-relaxed mb-9" style={{ fontSize: 15 }}>
        Create your first assignment to start collecting and grading student submissions. You can set up rubrics,
        define marking criteria, and let AI assist with grading.
      </p>

      <Button
        onClick={() => router.push('/assignments/create')}
        size="lg"
        className="rounded-full !bg-[#1A1A1A] !text-white border-0 hover:!bg-[#2a2a2a] shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:!bg-orange dark:hover:!bg-orange-light"
      >
        + Create Your First Assignment
      </Button>
    </div>
  );
}
