import { Monitor } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';

export default function ToolkitPage() {
  return (
    <>
      <Topbar
        title={<><Monitor className="w-4 h-4" /> AI Teacher&apos;s Toolkit</>}
        showBack={false}
      />
      <main className="flex-1 p-7 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🧰</div>
          <h2 className="text-text-primary text-xl font-bold mb-2">Toolkit coming soon</h2>
          <p className="text-sm text-text-secondary max-w-xs">
            Lesson plans, rubric generators, feedback tools and more.
          </p>
        </div>
      </main>
    </>
  );
}
