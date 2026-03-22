'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function usePDF() {
  const { addToast } = useAppStore();

  const downloadPDF = useCallback(
    async (elementId: string, filename: string) => {
      const element = document.getElementById(elementId);
      if (!element) {
        addToast('Could not find paper element', 'error');
        return;
      }

      addToast('Generating PDF…', 'info');

      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentW = pageW - 2 * margin;
        const contentH = (canvas.height * contentW) / canvas.width;

        let yPos = 0;
        let pageNum = 0;

        while (yPos < contentH) {
          if (pageNum > 0) pdf.addPage();

          const availH = pageH - 2 * margin;
          const srcY = (yPos / contentH) * canvas.height;
          const srcH = Math.min((availH / contentH) * canvas.height, canvas.height - srcY);
          const sliceH = (srcH / canvas.height) * contentH;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = srcH;
          const ctx = tempCanvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          pdf.addImage(
            tempCanvas.toDataURL('image/png'),
            'PNG',
            margin,
            margin,
            contentW,
            sliceH
          );

          yPos += availH;
          pageNum++;
        }

        pdf.save(filename);
        addToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error('[PDF] Generation error:', err);
        addToast('Failed to generate PDF. Please try again.', 'error');
      }
    },
    [addToast]
  );

  return { downloadPDF };
}
