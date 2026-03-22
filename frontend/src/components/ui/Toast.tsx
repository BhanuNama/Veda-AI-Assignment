'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Toast as ToastType } from '@/types';
import clsx from 'clsx';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-400" />,
  error:   <AlertCircle className="w-4 h-4 text-red-400"   />,
  info:    <Info        className="w-4 h-4 text-blue-400"  />,
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useAppStore();
  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      className={clsx(
        'flex items-center gap-3 px-5 py-3.5 rounded-2xl max-w-sm',
        'bg-[#1A1A2A] dark:bg-[#0E0E1C] text-white',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10'
      )}
      style={{ fontSize: 14, fontWeight: 500 }}
    >
      {icons[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="text-white/50 hover:text-white transition-colors ml-1">
        <X style={{ width: 14, height: 14 }} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts } = useAppStore();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
