import { BarChart2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';

export default function LibraryPage() {
  return (
    <>
      <Topbar
        title={<><BarChart2 className="w-4 h-4" /> My Library</>}
        showBack={false}
      />
      <main className="flex-1 p-7 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-text-primary text-xl font-bold mb-2">Library is empty</h2>
          <p className="text-sm text-text-secondary max-w-xs">
            Generated question papers and resources will be saved here.
          </p>
        </div>
      </main>
    </>
  );
}
