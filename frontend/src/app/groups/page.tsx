import { Users } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';

export default function GroupsPage() {
  return (
    <>
      <Topbar
        title={<><Users className="w-4 h-4" /> My Groups</>}
        showBack={false}
      />
      <main className="flex-1 p-7 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-text-primary text-xl font-bold mb-2">No groups yet</h2>
          <p className="text-sm text-text-secondary max-w-xs">
            Create groups to organize your students by class or section.
          </p>
        </div>
      </main>
    </>
  );
}
