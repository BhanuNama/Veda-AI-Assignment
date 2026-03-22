import { create } from 'zustand';
import { Assignment, QuestionPaper, Toast } from '@/types';

interface PendingJob {
  assignmentId: string;
  jobId: string;
}

interface AppState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  pendingJob: PendingJob | null;
  generatingStep: number;
  toasts: Toast[];
  theme: 'light' | 'dark';

  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  updateAssignmentStatus: (
    id: string,
    status: Assignment['status'],
    paper?: QuestionPaper,
    lastError?: string
  ) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  setPendingJob: (job: PendingJob | null) => void;
  setGeneratingStep: (step: number) => void;

  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  /** Directly set theme without toggling. Used by ThemeProvider on mount. */
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  assignments: [],
  currentAssignment: null,
  pendingJob: null,
  generatingStep: 0,
  toasts: [],
  theme: 'light',

  setAssignments: (assignments) => set({ assignments }),

  addAssignment: (assignment) =>
    set((state) => ({
      assignments: [assignment, ...state.assignments],
    })),

  removeAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a._id !== id),
      currentAssignment:
        state.currentAssignment?._id === id ? null : state.currentAssignment,
    })),

  updateAssignmentStatus: (id, status, paper, lastError) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id
          ? { ...a, status, ...(paper ? { paper } : {}), ...(lastError ? { lastError } : {}) }
          : a
      ),
      currentAssignment:
        state.currentAssignment?._id === id
          ? { ...state.currentAssignment, status, ...(paper ? { paper } : {}) }
          : state.currentAssignment,
    })),

  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setPendingJob: (job) => set({ pendingJob: job, generatingStep: 0 }),
  setGeneratingStep: (step) => set({ generatingStep: step }),

  addToast: (message, type = 'info') =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `${Date.now()}-${Math.random()}`, message, type },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setTheme: (theme) =>
    set(() => {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
        localStorage.setItem('veda-theme', theme);
      }
      return { theme };
    }),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(next);
        localStorage.setItem('veda-theme', next);
      }
      return { theme: next };
    }),
}));
