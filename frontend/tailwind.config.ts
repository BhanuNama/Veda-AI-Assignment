import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#E05A2B',
          light: '#F07040',
          bg: '#FEF0EA',
        },
        dark: '#1A1A1A',
        // These map to CSS vars → auto-update on theme switch
        surface:        'var(--c-surface)',
        card:           'var(--c-card)',
        'border-default':'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        'text-primary':  'var(--c-text-primary)',
        'text-secondary':'var(--c-text-secondary)',
        'text-muted':    'var(--c-text-muted)',
        easy:     '#22C55E',
        moderate: '#F59E0B',
        hard:     '#EF4444',
      },
      fontFamily: {
        // Quotes required — unquoted "Vastago Grotesk" is invalid CSS (two family names)
        sans: ['"Vastago Grotesk"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(224,90,43,0.12)',
        dropdown: '0 8px 24px rgba(0,0,0,0.12)',
      },
      width: {
        sidebar: '360px',
      },
    },
  },
  plugins: [],
};

export default config;
