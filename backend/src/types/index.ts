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
  fileContent?: string;   // extracted text from uploaded file
  fileName?: string;      // original filename for display
  variationSeed?: string; // used to force diversity on regeneration
  avoidQuestions?: string[]; // question texts to avoid repeating
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
  meta?: {
    topic?: string;
  };
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

export type JobStep =
  | 'processing_details'
  | 'structuring_sections'
  | 'calibrating_difficulty'
  | 'generating_answers';

export const JOB_STEPS: JobStep[] = [
  'processing_details',
  'structuring_sections',
  'calibrating_difficulty',
  'generating_answers',
];

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
  | { event: 'connected';   data: { jobId: string } }
  | { event: 'job:queued';  data: { jobId: string; assignmentId: string } }
  | { event: 'job:step';    data: JobProgressData }
  | { event: 'job:completed'; data: JobCompletedData }
  | { event: 'job:failed';  data: JobFailedData };
