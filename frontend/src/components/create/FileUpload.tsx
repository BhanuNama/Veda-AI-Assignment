'use client';

import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import clsx from 'clsx';

/** Reference-style dropzone: dashed border, cloud icon, Browse pill. */
export function FileUpload({ onFileSelect }: { onFileSelect?: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    onFileSelect?.(f);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const isActive = drag || file;

  return (
    <div>
      <div
        className={clsx(
          'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-200',
          isActive
            ? 'border-[#9CA3AF] bg-[#ECECEC] dark:border-neutral-500 dark:bg-[#3f3f46]'
            : 'border-[#D1D5DB] bg-[#F7F7F7] hover:border-[#B8BCC4] dark:border-neutral-600 dark:bg-[#27272a]'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 shrink-0 text-[#525252] dark:text-neutral-300" />
            <div className="min-w-0 text-left">
              <p className="truncate text-[#171717] dark:text-white" style={{ fontSize: 14, fontWeight: 600 }}>
                {file.name}
              </p>
              <p className="text-[#737373] dark:text-neutral-400" style={{ fontSize: 12 }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="ml-2 rounded-full p-1.5 text-[#737373] transition-colors hover:bg-[#E5E5E5] hover:text-[#171717] dark:hover:bg-[#52525b]"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto mb-3 h-10 w-10 text-[#6B7280] dark:text-neutral-400" strokeWidth={1.35} />
            <p className="mb-1 text-[#262626] dark:text-neutral-100" style={{ fontSize: 15, fontWeight: 600 }}>
              Choose a file or drag &amp; drop it here
            </p>
            <p className="mb-5 text-[#737373] dark:text-neutral-400" style={{ fontSize: 13 }}>
              JPEG, PNG, upto 10MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="rounded-full border border-[#E5E7EB] bg-white px-6 py-2.5 text-[#404040] shadow-sm transition-colors hover:bg-[#F3F4F6] dark:border-neutral-600 dark:bg-[#3f3f46] dark:text-neutral-100 dark:hover:bg-[#52525b]"
              style={{ fontSize: 14, fontWeight: 600 }}
            >
              Browse Files
            </button>
          </>
        )}
      </div>
      <p
        className="mt-3 text-center text-[#9CA3AF] dark:text-neutral-500"
        style={{ fontSize: 12, fontWeight: 500 }}
      >
        Upload images of your preferred document/image
      </p>
    </div>
  );
}
