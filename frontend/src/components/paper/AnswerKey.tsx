import { AnswerKeyItem } from '@/types';

export function AnswerKey({ items }: { items: AnswerKeyItem[] }) {
  return (
    <div className="glass-paper w-full max-w-3xl mx-auto rounded-2xl px-8 py-8 shadow-[0_12px_48px_var(--glass-card-shad),0_1px_0_rgba(255,255,255,0.08)_inset]">
      <h3
        className="text-text-primary mb-6"
        style={{ fontSize: 18, fontWeight: 800, borderBottom: '2px solid var(--c-text-primary)', paddingBottom: 14 }}
      >
        Answer Key
      </h3>
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.qNum} className="flex gap-4">
            <span className="text-text-primary flex-shrink-0 w-6" style={{ fontSize: 15, fontWeight: 800 }}>
              {item.qNum}.
            </span>
            <p className="text-text-primary leading-relaxed flex-1" style={{ fontSize: 15 }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
