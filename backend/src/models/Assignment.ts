import mongoose, { Schema, Document } from 'mongoose';
import { AssignmentFormData, QuestionPaper } from '../types';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  topic: string;
  assignedOn: string;
  due: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  paper?: QuestionPaper;
  blueprintMeta?: {
    topicsCovered?: string[];
    difficultyCounts?: { easy: number; moderate: number; hard: number };
    coverageScore?: number; // 0..100
  };
  formData: AssignmentFormData;
  jobId?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
  options: [{ type: String }],
  meta: {
    topic: { type: String },
  },
});

const SectionSchema = new Schema({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  type: { type: String, required: true },
  questions: [QuestionSchema],
});

const AnswerKeyItemSchema = new Schema({
  qNum: { type: Number, required: true },
  sectionTitle: { type: String, required: true },
  answer: { type: String, required: true },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    topic: { type: String, required: true },
    assignedOn: { type: String, required: true },
    due: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
    },
    paper: {
      schoolName: String,
      subject: String,
      grade: String,
      topic: String,
      timeAllowed: Number,
      maxMarks: Number,
      sections: [SectionSchema],
      answerKey: [AnswerKeyItemSchema],
    },
    blueprintMeta: {
      topicsCovered: [{ type: String }],
      difficultyCounts: {
        easy: { type: Number },
        moderate: { type: Number },
        hard: { type: Number },
      },
      coverageScore: { type: Number },
    },
    formData: {
      subject: String,
      grade: String,
      topic: String,
      due: String,
      time: Number,
      instructions: String,
      questionTypes: [
        new Schema(
          { type: { type: String }, count: Number, marks: Number },
          { _id: false }
        ),
      ],
      blueprint: {
        enabled: { type: Boolean },
        difficulty: {
          easy: { type: Number },
          moderate: { type: Number },
          hard: { type: Number },
        },
        topics: [new Schema({ name: String, weight: Number }, { _id: false })],
      },
    },
    jobId: { type: String },
    lastError: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
