import clsx from 'clsx';

type Difficulty = 'Easy' | 'Moderate' | 'Hard';

const difficultyStyles: Record<Difficulty, string> = {
  Easy:     'bg-green-100   text-green-700   dark:bg-green-900/40   dark:text-green-400',
  Moderate: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',
  Hard:     'bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-400',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide',
        difficultyStyles[difficulty]
      )}
    >
      {difficulty}
    </span>
  );
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-orange text-white',
        className
      )}
    >
      {count}
    </span>
  );
}
