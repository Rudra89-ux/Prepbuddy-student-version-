export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'admin';
  createdAt: any;
}

export interface Subject {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface Question {
  id: string;
  chapterId: string;
  subjectId: string;
  type: 'mcq' | 'assertion_reason' | 'match_following';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  imageUrl?: string;
}

export interface MockTest {
  id?: string;
  title: string;
  description: string;
  subjectId: string;
  questionIds: string[];
  duration: number; // in minutes
  createdAt: any;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface TestResult {
  id: string;
  studentId: string;
  subjectId: string;
  chapterId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  timestamp: any;
  testType: 'chapter' | 'mock' | 'subjective';
  answers?: UserAnswer[];
  studentEmail?: string;
  subjectName?: string;
  testTitle?: string;
}
