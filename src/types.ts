export type Persona = 'judge' | 'buddy';

export type CEFRLevel = 'A2' | 'B1' | 'B2' | 'C1';

export type TopicCategory =
  | 'THCS & Đời sống'
  | 'IELTS Speaking'
  | 'Hùng biện WSDC'
  | 'Phỏng vấn Du học'
  | 'Giao tiếp hằng ngày';

export type Stance = 'for' | 'against' | 'neutral';

export type NavTab = 'home' | 'learn' | 'arena' | 'world' | 'topics' | 'pricing' | 'dashboard' | 'profile';

export interface VocabItem {
  word: string;
  ipa: string;
  meaningVi: string;
}

export interface DebateTopic {
  id: string;
  title: string;
  titleVi: string;
  motion: string;
  category: TopicCategory;
  level: CEFRLevel;
  isPro: boolean;
  durationMin: number;
  keyVocab: VocabItem[];
  openingQuestionJudge: string;
  openingQuestionBuddy: string;
  sampleHints: string[];
  followUpsJudge: string[];
  followUpsBuddy: string[];
}

export interface WordPronunciation {
  word: string;
  ipa: string;
  score: number;
  tip?: string;
}

export interface GrammarIssue {
  original: string;
  corrected: string;
  explanationVi: string;
  rule: string;
}

export interface BetterExpression {
  phrase: string;
  level: string;
  contextVi: string;
}

export interface TurnAnalysis {
  overallScore: number;
  fluencyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  argumentScore: number;
  detectedLevel: CEFRLevel;
  pronunciationWords: WordPronunciation[];
  grammarIssues: GrammarIssue[];
  betterExpressions: BetterExpression[];
  encouragementVi: string;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
  persona?: Persona;
  analysis?: TurnAnalysis;
  speechRate?: number;
}

export interface SavedExpression {
  id: string;
  phrase: string;
  level: string;
  contextVi: string;
  topicTitle: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  className: string;
  avatarInitials: string;
  cefr: CEFRLevel;
  weeklyMinutes: number;
  avgScore: number;
  pronunciationAvg: number;
  grammarAvg: number;
  homeworkStatus: 'completed' | 'in_progress' | 'overdue';
  streakDays: number;
  commonMistakes: string[];
  recentTopics: string[];
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  className: string;
  persona: Persona;
  targetMinutes: number;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
}
