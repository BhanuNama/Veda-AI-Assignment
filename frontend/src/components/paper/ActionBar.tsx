'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Download, FileText, KeyRound, Layers, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';

interface ActionBarProps {
  assignmentId: string;
  title: string;
  onRegenerate?: (jobId: string) => void;
}

export function ActionBar({ assignmentId, title, onRegenerate }: ActionBarProps) {
  const { setPendingJob, updateAssignmentStatus, addToast } = useAppStore();
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState<null | 'paper' | 'key' | 'both'>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const safeBase = title.replace(/[^a-z0-9]/gi, '-');

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const downloadVariant = async (variant: 'paper' | 'key' | 'both') => {
    setOpen(false);
    setDownloading(variant);
    try {
      const blob = await api.downloadPdf(assignmentId, variant);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        variant === 'paper'
          ? `${safeBase}-question-paper.pdf`
          : variant === 'key'
            ? `${safeBase}-answer-key.pdf`
            : `${safeBase}-paper-with-key.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to download PDF.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { assignmentId: aid, jobId } = await api.regenerateAssignment(assignmentId);
      updateAssignmentStatus(assignmentId, 'generating');
      setPendingJob({ assignmentId: aid, jobId });
      onRegenerate?.(jobId);
      addToast('Regenerating question paper…', 'info');
    } catch {
      addToast('Failed to start regeneration.', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const menuPanelStyle = {
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(18px) saturate(180%)',
    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
  } as const;

  return (
    <>
      {/* Outside rootRef so click-outside + backdrop tap both close */}
      {open && (
        <button
          type="button"
          aria-label="Close download menu"
          className="lg:hidden fixed inset-0 z-[115] bg-black/35"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        ref={rootRef}
        className={clsx(
          'rounded-2xl px-4 sm:px-5 py-4 flex flex-col gap-3 sm:gap-4 mb-5 relative',
          open && 'z-[120]'
        )}
        style={{
          background: 'rgba(22, 22, 22, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
        }}
      >
        <div className="relative z-[125] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-[13px] text-white/75 flex-1 leading-relaxed">
          ✦ Your AI-generated question paper is ready! Review it below and download as PDF.
        </p>
        <div className="flex gap-2.5 flex-shrink-0 w-full sm:w-auto">
          <Button
            variant="outline-white"
            size="sm"
            onClick={handleRegenerate}
            loading={regenerating}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </Button>
          <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
            <Button
              variant="white"
              size="sm"
              onClick={() => setOpen((v) => !v)}
              loading={downloading !== null}
              className="w-full"
              aria-expanded={open}
              aria-haspopup="listbox"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>

            {/* Desktop: anchored under Download button */}
            {open && (
              <div
                className="hidden sm:block absolute right-0 top-full mt-2 z-[130] w-[min(100vw-2rem,280px)] max-w-[280px] rounded-2xl overflow-hidden"
                style={menuPanelStyle}
                role="listbox"
              >
                <DownloadMenuItems onPick={downloadVariant} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: full-width panel below the whole bar, opens downward */}
      {open && (
        <div
          className="sm:hidden relative z-[125] w-full rounded-2xl overflow-hidden max-h-[min(60vh,320px)] overflow-y-auto"
          style={menuPanelStyle}
          role="listbox"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/[0.06]">
            <span className="text-[13px] font-bold text-[#111]">Download PDF</span>
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-black/5 -mr-1"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4 text-[#111]" />
            </button>
          </div>
          <DownloadMenuItems onPick={downloadVariant} />
        </div>
      )}
      </div>
    </>
  );
}

function DownloadMenuItems({ onPick }: { onPick: (v: 'paper' | 'key' | 'both') => void }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onPick('paper')}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/5 active:bg-black/10 transition-colors"
      >
        <FileText className="w-4 h-4 text-orange shrink-0" />
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold text-[#111]">Download Question Paper</div>
          <div className="text-[12px] text-black/60">Paper only</div>
        </div>
      </button>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
      <button
        type="button"
        onClick={() => onPick('key')}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/5 active:bg-black/10 transition-colors"
      >
        <KeyRound className="w-4 h-4 text-orange shrink-0" />
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold text-[#111]">Download Answer Key</div>
          <div className="text-[12px] text-black/60">Key only</div>
        </div>
      </button>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
      <button
        type="button"
        onClick={() => onPick('both')}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/5 active:bg-black/10 transition-colors"
      >
        <Layers className="w-4 h-4 text-orange shrink-0" />
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold text-[#111]">Download Paper with Key</div>
          <div className="text-[12px] text-black/60">Combined PDF</div>
        </div>
      </button>
    </>
  );
}
