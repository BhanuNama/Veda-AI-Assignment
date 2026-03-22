export interface QuestionTypeInput {
  type: string;
  count: number;
  marks: number;
}

export interface AssignmentFormData {
  subject: string;
  grade: string;
  topic: string;
  due: string;
  time: number;
  instructions?: string;
  questionTypes: QuestionTypeInput[];
  blueprint?: {
    enabled: boolean;
    difficulty?: { easy: number; moderate: number; hard: number }; // percentages summing to 100
    topics?: Array<{ name: string; weight: number }>; // percentages summing to 100
  };
}

export interface Question {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  options: string[];
}

export interface Section {
  title: string;
  instruction: string;
  type: string;
  questions: Question[];
}

export interface AnswerKeyItem {
  qNum: number;
  sectionTitle: string;
  answer: string;
}

export interface QuestionPaper {
  schoolName: string;
  subject: string;
  grade: string;
  topic: string;
  timeAllowed: number;
  maxMarks: number;
  sections: Section[];
  answerKey: AnswerKeyItem[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  assignedOn: string;
  due: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  paper?: QuestionPaper;
  formData: AssignmentFormData;
  jobId?: string;
  lastError?: string;
  blueprintMeta?: {
    topicsCovered?: string[];
    difficultyCounts?: { easy: number; moderate: number; hard: number };
    coverageScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type JobStep =
  | 'processing_details'
  | 'structuring_sections'
  | 'calibrating_difficulty'
  | 'generating_answers';

export interface JobProgressData {
  jobId: string;
  assignmentId: string;
  step: JobStep;
  stepIndex: number;
  totalSteps: number;
  label: string;
}

export interface JobCompletedData {
  jobId: string;
  assignmentId: string;
  paper: QuestionPaper;
}

export interface JobFailedData {
  jobId: string;
  assignmentId: string;
  error: string;
}

export type WSMessage =
  | { event: 'connected'; data: { jobId: string } }
  | { event: 'job:queued'; data: { jobId: string; assignmentId: string } }
  | { event: 'job:step'; data: JobProgressData }
  | { event: 'job:completed'; data: JobCompletedData }
  | { event: 'job:failed'; data: JobFailedData };

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type NavView =
  | 'home'
  | 'groups'
  | 'assignments'
  | 'toolkit'
  | 'library';
