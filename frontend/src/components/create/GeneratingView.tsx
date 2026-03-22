'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Processing assignment details',  description: 'Parsing your input'                  },
  { label: 'Structuring question sections',  description: 'Organising Section A, B, C…'         },
  { label: 'Calibrating difficulty levels',  description: 'Balancing Easy / Moderate / Hard'    },
  { label: 'Generating answer key',          description: 'Crafting model answers'              },
];

export function GeneratingView({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
      {/* Spinner */}
      <div className="relative mb-8">
        <motion.div
          className="w-18 h-18 rounded-full border-[3px] border-border-default border-t-orange"
          style={{ width: 72, height: 72 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 22 }}>✦</div>
      </div>

      <h2 className="text-text-primary mb-2" style={{ fontSize: 22, fontWeight: 800 }}>
        Generating your question paper…
      </h2>
      <p className="text-text-secondary mb-10 max-w-sm" style={{ fontSize: 15 }}>
        Our AI is crafting a customised paper based on your specifications.
      </p>

      {/* Steps */}
      <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden">
        {STEPS.map((step, i) => {
          const isDone   = i < currentStep;
          const isActive = i === currentStep;
          const isPending = i > currentStep;
          return (
            <div
              key={i}
              className={clsx('flex items-center gap-4 px-6 py-4', i < STEPS.length - 1 && 'border-b border-border-default')}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  isDone   && 'bg-green-500 text-white',
                  isActive && 'bg-orange text-white',
                  isPending && 'bg-surface text-text-muted border border-border-default'
                )}
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                {isDone ? <Check style={{ width: 15, height: 15 }} /> :
                 isActive ? (
                   <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                     ⟳
                   </motion.span>
                 ) : i + 1}
              </div>
              <div className="text-left">
                <p className={clsx(
                  'transition-colors',
                  isDone   && 'text-text-muted line-through',
                  isActive && 'text-text-primary',
                  isPending && 'text-text-muted'
                )} style={{ fontSize: 15, fontWeight: isActive ? 700 : 500 }}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>
                    {step.description}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mt-5 h-2 bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-orange rounded-full"
          initial={{ width: '5%' }}
          animate={{ width: `${Math.max(5, ((currentStep + 1) / STEPS.length) * 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
