import { QuestionPaper as QPType } from '@/types';
import { DifficultyBadge } from '@/components/ui/Badge';

export function QuestionPaper({ paper }: { paper: QPType }) {
  let globalQ = 1;

  return (
    <div className="glass-paper w-full max-w-3xl mx-auto rounded-2xl px-5 py-8 sm:px-12 sm:py-10 shadow-[0_12px_48px_var(--glass-card-shad),0_1px_0_rgba(255,255,255,0.08)_inset]">
      {/* Header */}
      <div className="text-center pb-5 mb-6" style={{ borderBottom: '2px solid var(--c-text-primary)' }}>
        <h2 className="text-text-primary mb-1.5" style={{ fontSize: 24, fontWeight: 900 }}>
          {paper.schoolName}
        </h2>
        <p className="text-text-secondary" style={{ fontSize: 14 }}>Subject: {paper.subject}</p>
        <p className="text-text-secondary" style={{ fontSize: 14 }}>Class: {paper.grade}</p>
      </div>

      {/* Time + Marks */}
      <div className="flex justify-between py-3 mb-4" style={{ borderBottom: '1px solid var(--c-border)', fontSize: 14 }}>
        <span className="text-text-primary" style={{ fontWeight: 500 }}>
          Time Allowed: <strong>{paper.timeAllowed} minutes</strong>
        </span>
        <span className="text-text-primary" style={{ fontWeight: 500 }}>
          Maximum Marks: <strong>{paper.maxMarks}</strong>
        </span>
      </div>

      <p className="text-text-secondary mb-6" style={{ fontSize: 14, fontStyle: 'italic' }}>
        All questions are compulsory unless stated otherwise.
      </p>

      {/* Student fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {['Name', 'Roll Number', 'Class & Section'].map((label) => (
          <div key={label}>
            <span className="text-text-primary block mb-1.5" style={{ fontSize: 13, fontWeight: 700 }}>
              {label}:
            </span>
            <div style={{ borderBottom: '1.5px solid var(--c-text-primary)', minHeight: 22 }} />
          </div>
        ))}
      </div>

      {/* Sections */}
      {paper.sections.map((section, si) => (
        <div key={si} className="mb-10">
          <div className="text-center mb-1">
            <h3 className="text-text-primary" style={{ fontSize: 17, fontWeight: 800 }}>
              {section.title}
            </h3>
          </div>
          <p className="text-center text-text-secondary mb-6" style={{ fontSize: 13, fontStyle: 'italic' }}>
            {section.type} &nbsp;|&nbsp; {section.instruction}
          </p>

          <div className="space-y-5">
            {section.questions.map((q, qi) => {
              const qNumber = globalQ++;
              return (
                <div key={qi} className="flex gap-4 pb-5" style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <span className="text-text-primary flex-shrink-0 w-6 pt-0.5" style={{ fontSize: 15, fontWeight: 800 }}>
                    {qNumber}.
                  </span>
                  <div className="flex-1">
                    <p className="text-text-primary leading-relaxed mb-2.5" style={{ fontSize: 15 }}>
                      {q.text}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                        {q.options.map((opt, oi) => (
                          <span key={oi} className="text-text-secondary" style={{ fontSize: 14 }}>{opt}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 mt-2">
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span className="text-text-muted" style={{ fontSize: 12, fontWeight: 600 }}>
                        [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* End */}
      <div className="text-center pt-5 mt-2" style={{ borderTop: '2px solid var(--c-text-primary)' }}>
        <p className="text-text-secondary tracking-wide" style={{ fontSize: 14, fontWeight: 700 }}>
          — End of Question Paper —
        </p>
      </div>
    </div>
  );
}
