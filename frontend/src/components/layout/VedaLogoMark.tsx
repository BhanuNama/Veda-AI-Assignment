'use client';

import { useId } from 'react';

/**
 * Brand mark: squircle — dark from bottom-left, orange from top-right; white “V”.
 */
export function VedaLogoMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const gradId = `veda-mark-grad-${uid}`;
  const vShadeId = `veda-v-shade-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
      aria-hidden
    >
      <defs>
        {/* Bottom-left → black/dark, top-right → orange (vector points BL → TR) */}
        <linearGradient id={gradId} x1="4" y1="48" x2="48" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A0605" />
          <stop offset="0.28" stopColor="#3D1A0E" />
          <stop offset="0.55" stopColor="#A84A1E" />
          <stop offset="0.82" stopColor="#E87828" />
          <stop offset="1" stopColor="#FFC98A" />
        </linearGradient>
        {/* Slight fold on outer left stem of the V */}
        <linearGradient id={vShadeId} x1="14" y1="12" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A0A0A0" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="52" height="52" rx="14" fill={`url(#${gradId})`} />

      {/* Symmetric bold V: outer perimeter, flat base, crisp inner notch */}
      <path
        fill="#FFFFFF"
        d="
          M 15.25 11.75
          L 20.4 11.75
          L 26 31.85
          L 31.6 11.75
          L 36.75 11.75
          L 27.35 37.25
          L 24.65 37.25
          Z
        "
      />

      {/* Subtle depth on outer-left stem */}
      <path
        fill={`url(#${vShadeId})`}
        d="M 15.25 11.75 L 20.4 11.75 L 25.35 32.2 L 24.65 37.25 Z"
      />
    </svg>
  );
}
