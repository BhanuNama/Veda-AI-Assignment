import { FileText } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { CreateForm } from '@/components/create/CreateForm';

export default function CreateAssignmentPage() {
  return (
    <>
      <Topbar
        title={
          <>
            <FileText className="w-4 h-4" />
            Assignment
          </>
        }
        backHref="/assignments"
      />

      <main className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden px-4 pb-8 pt-2 lg:px-6 lg:pt-2">
        {/* Desktop: same edge as Assignments page — flush left beside sidebar */}
        <div className="mb-5 hidden w-full pt-0.5 text-left lg:mb-6 lg:block">
          <h1
            className="flex items-center gap-2.5 text-text-primary"
            style={{ fontSize: 22, fontWeight: 900 }}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-easy" aria-hidden />
            Create Assignment
          </h1>
          <p className="mt-1 text-text-secondary" style={{ fontSize: 14, fontWeight: 400 }}>
            Set up a new assignment for your students
          </p>
        </div>

        {/* Form only: centred in main column; title stays left above */}
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <CreateForm />
        </div>
      </main>
    </>
  );
}
