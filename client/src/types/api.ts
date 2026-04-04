export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string>;
}

/* ---- Phase 2 Types ---- */

// Chapters
export interface ChapterSummary {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  level: string;
  learningPath: 'sproochentest' | 'daily_life';
  status: 'locked' | 'in_progress' | 'completed';
  progress: {
    grammar: number;
    reading: number;
    listening: number;
    speaking: number;
  };
  quizPassed: boolean;
}

export interface ChapterListResponse {
  chapters: ChapterSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  skill: string;
  orderIndex: number;
  completed?: boolean;
}

export interface SpeakingPromptSummary {
  id: string;
  topic: string;
  suggestedVocabulary: string;
  guidingQuestions: string[];
  difficulty: string;
}

export interface ShadowingExerciseSummary {
  id: string;
  nativeAudioUrl: string;
  transcript: string;
  orderIndex: number;
}

export interface ChapterDetailResponse {
  id: string;
  title: string;
  description: string;
  level: string;
  learningPath: string;
  sections: {
    skill: 'grammar' | 'reading' | 'listening' | 'speaking';
    lessons: LessonSummary[];
    completedCount: number;
    totalCount: number;
  }[];
  speakingPrompts: SpeakingPromptSummary[];
  shadowingExercises: ShadowingExerciseSummary[];
  quizUnlocked: boolean;
  quizPassed: boolean;
}

// Quizzes
export interface QuizQuestion {
  id: string;
  skill: string;
  type: 'multiple-choice' | 'fill-blank' | 'listening-comprehension' | 'speaking-prompt';
  prompt: string;
  options?: string[];
  audioUrl?: string;
  referenceAudioUrl?: string;
}

export interface ChapterQuizResponse {
  quizId: string;
  chapterId: string;
  questions: QuizQuestion[];
}

export interface QuizResultResponse {
  score: number;
  passed: boolean;
  attempts: number;
  highestScore: number;
  breakdown: { skill: string; correct: number; total: number }[];
  incorrectAnswers: {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];
}

// Gamification
export interface XPTransaction {
  id: string;
  amount: number;
  activityType: string;
  description: string;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  badgeKey: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface LockedBadge {
  badgeKey: string;
  name: string;
  description: string;
  iconUrl: string;
  criteria: string;
}

export interface GamificationSummaryResponse {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  badges: UserBadge[];
  recentXpGains: XPTransaction[];
}

export interface BadgeListResponse {
  earned: UserBadge[];
  locked: LockedBadge[];
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalXp: number;
  currentStreak: number;
  badgeCount: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: { rank: number; totalXp: number } | null;
  period: 'weekly' | 'monthly' | 'all_time';
}

// Peers
export interface AvailablePeer {
  userId: string;
  displayName: string;
  level: string;
  availableSince: string;
}

export interface AvailablePeersResponse {
  peers: AvailablePeer[];
  totalAvailable: number;
}

export interface PeerInviteResponse {
  invitationId: string;
  expiresAt: string;
}

export interface PeerAcceptResponse {
  sessionId: string;
  prompt: SpeakingPromptSummary;
}

// Speaking
export interface SpeakingRecordResponse {
  attemptId: string;
  recordingUrl: string;
  referenceAudioUrl: string;
}

export interface ShadowingExerciseResponse {
  id: string;
  nativeAudioUrl: string;
  transcript: string;
  availableSpeeds: number[];
}

// Sproochentest
export interface SproochentestExam {
  id: string;
  sections: SproochentestSection[];
  timeLimit: number;
}

export interface SproochentestSection {
  type: 'oral_production' | 'listening_comprehension';
  exercises: SproochentestExercise[];
}

export interface SproochentestExercise {
  id: string;
  type: string;
  prompt: string;
  audioUrl?: string;
  imageUrl?: string;
  topicCard?: string;
  questions?: { id: string; prompt: string; options?: string[] }[];
  timeLimit?: number;
}

export interface SproochentestResult {
  totalScore: number;
  passed: boolean;
  sections: {
    type: string;
    score: number;
    feedback: string;
  }[];
}

export interface TopicCard {
  id: string;
  topic: string;
  level: string;
  imageUrl?: string;
  description: string;
}
