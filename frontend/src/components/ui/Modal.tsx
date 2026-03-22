'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function Modal({
  open, title, description,
  confirmLabel = 'Confirm', confirmVariant = 'primary',
  onConfirm, onCancel,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            className="relative glass-card rounded-3xl p-8 w-full max-w-md"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <h3
              className="text-text-primary mb-2.5"
              style={{ fontSize: 20, fontWeight: 800 }}
            >
              {title}
            </h3>
            <p
              className="text-text-secondary mb-7"
              style={{ fontSize: 15 }}
            >
              {description}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={onCancel}>Cancel</Button>
              <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
