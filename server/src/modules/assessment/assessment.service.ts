import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

// Types
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SkillComponent = 'grammar' | 'reading' | 'listening' | 'speaking';

const VALID_CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SKILL_COMPONENTS: SkillComponent[] = ['grammar', 'reading', 'listening', 'speaking'];

// In-memory question bank
export interface Question {
  id: string;
  skill: SkillComponent;
  category: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

const questionBank: Question[] = [
  // Grammar questions
  { id: 'g1', skill: 'grammar', category: 'verb conjugation', prompt: 'Select the correct verb form: "Ech ___ Lëtzebuergesch."', options: ['schwätzen', 'schwätzt', 'schwätze', 'geschwat'], correctAnswer: 'schwätzen' },
  { id: 'g2', skill: 'grammar', category: 'articles', prompt: 'Choose the correct article: "___ Buch ass interessant."', options: ['Den', 'Dat', 'D\'', 'Dem'], correctAnswer: 'Dat' },
  { id: 'g3', skill: 'grammar', category: 'word order', prompt: 'Which sentence has correct word order?', options: ['Hien geet an d\'Schoul.', 'Hien an d\'Schoul geet.', 'An d\'Schoul hien geet.', 'Geet hien d\'Schoul an.'], correctAnswer: 'Hien geet an d\'Schoul.' },
  { id: 'g4', skill: 'grammar', category: 'pronouns', prompt: 'Select the correct pronoun: "___ ass mäi Frënd."', options: ['Hien', 'Hatt', 'Si', 'Mir'], correctAnswer: 'Hien' },
  { id: 'g5', skill: 'grammar', category: 'prepositions', prompt: 'Choose the correct preposition: "Ech ginn ___ d\'Aarbecht."', options: ['op', 'an', 'bei', 'mat'], correctAnswer: 'op' },

  // Reading questions
  { id: 'r1', skill: 'reading', category: 'vocabulary', prompt: 'What does "Moien" mean?', options: ['Goodbye', 'Hello', 'Thank you', 'Please'], correctAnswer: 'Hello' },
  { id: 'r2', skill: 'reading', category: 'comprehension', prompt: 'Read: "De Mupp ass am Gaart." Where is the dog?', options: ['In the house', 'In the garden', 'At school', 'In the car'], correctAnswer: 'In the garden' },
  { id: 'r3', skill: 'reading', category: 'vocabulary', prompt: 'What does "Merci" mean in Luxembourgish?', options: ['Sorry', 'Hello', 'Thank you', 'Goodbye'], correctAnswer: 'Thank you' },
  { id: 'r4', skill: 'reading', category: 'comprehension', prompt: 'Read: "D\'Kanner spillen am Parc." Who is playing?', options: ['The adults', 'The children', 'The teachers', 'The animals'], correctAnswer: 'The children' },
  { id: 'r5', skill: 'reading', category: 'vocabulary', prompt: 'What does "Äddi" mean?', options: ['Hello', 'Please', 'Goodbye', 'Sorry'], correctAnswer: 'Goodbye' },

  // Listening questions
  { id: 'l1', skill: 'listening', category: 'word recognition', prompt: 'Which word did you hear? (Assume: "Schoul")', options: ['School', 'Chair', 'Table', 'Book'], correctAnswer: 'School' },
  { id: 'l2', skill: 'listening', category: 'phrase understanding', prompt: 'What was said? (Assume: "Wéi geet et?")', options: ['How are you?', 'Where are you?', 'Who are you?', 'What is that?'], correctAnswer: 'How are you?' },
  { id: 'l3', skill: 'listening', category: 'word recognition', prompt: 'Which word did you hear? (Assume: "Waasser")', options: ['Water', 'Weather', 'Window', 'Winter'], correctAnswer: 'Water' },
  { id: 'l4', skill: 'listening', category: 'phrase understanding', prompt: 'What was said? (Assume: "Ech hunn Honger")', options: ['I am tired', 'I am hungry', 'I am happy', 'I am cold'], correctAnswer: 'I am hungry' },
  { id: 'l5', skill: 'listening', category: 'word recognition', prompt: 'Which word did you hear? (Assume: "Buch")', options: ['Book', 'Bridge', 'Bread', 'Bus'], correctAnswer: 'Book' },

  // Speaking questions
  { id: 's1', skill: 'speaking', category: 'pronunciation', prompt: 'How do you say "Good morning" in Luxembourgish?', options: ['Moien', 'Äddi', 'Merci', 'Wann ech gelift'], correctAnswer: 'Moien' },
  { id: 's2', skill: 'speaking', category: 'conversation', prompt: 'How do you respond to "Wéi geet et?"', options: ['Gutt, merci', 'Äddi', 'Moien', 'Wann ech gelift'], correctAnswer: 'Gutt, merci' },
  { id: 's3', skill: 'speaking', category: 'pronunciation', prompt: 'How do you say "Thank you" in Luxembourgish?', options: ['Merci', 'Moien', 'Äddi', 'Pardon'], correctAnswer: 'Merci' },
  { id: 's4', skill: 'speaking', category: 'conversation', prompt: 'How do you say "Please" in Luxembourgish?', options: ['Wann ech gelift', 'Merci', 'Moien', 'Äddi'], correctAnswer: 'Wann ech gelift' },
  { id: 's5', skill: 'speaking', category: 'pronunciation', prompt: 'How do you say "Goodbye" in Luxembourgish?', options: ['Äddi', 'Moien', 'Merci', 'Pardon'], correctAnswer: 'Äddi' },
];

// In-memory assessment sessions (maps assessmentId -> session data)
interface AssessmentSession {
  id: string;
  userId: string;
  questions: Question[];
  createdAt: Date;
}

const assessmentSessions = new Map<string, AssessmentSession>();

export function getQuestionBank(): Question[] {
  return questionBank;
}

export function getAssessmentSessions(): Map<string, AssessmentSession> {
  return assessmentSessions;
}

// Start a new assessment
export function startAssessment(userId: string) {
  const assessmentId = uuidv4();
  const session: AssessmentSession = {
    id: assessmentId,
    userId,
    questions: [...questionBank],
    createdAt: new Date(),
  };
  assessmentSessions.set(assessmentId, session);

  return {
    assessmentId,
    sections: [...SKILL_COMPONENTS],
    questions: questionBank.map((q) => ({
      id: q.id,
      skill: q.skill,
      prompt: q.prompt,
      options: q.options,
    })),
  };
}

// Score percentage to CEFR level
export function percentToLevel(percent: number): CEFRLevel {
  if (percent >= 91) return 'C2';
  if (percent >= 81) return 'C1';
  if (percent >= 66) return 'B2';
  if (percent >= 51) return 'B1';
  if (percent >= 31) return 'A2';
  return 'A1';
}

// Compute strengths and improvements for a skill based on answered questions
function computeFeedback(
  questions: Question[],
  answers: Map<string, string>,
): { strengths: string[]; improvements: string[] } {
  const categoryResults = new Map<string, { correct: number; total: number }>();

  for (const q of questions) {
    const entry = categoryResults.get(q.category) || { correct: 0, total: 0 };
    entry.total++;
    const userAnswer = answers.get(q.id);
    if (userAnswer === q.correctAnswer) {
      entry.correct++;
    }
    categoryResults.set(q.category, entry);
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const [category, result] of categoryResults) {
    const pct = result.total > 0 ? (result.correct / result.total) * 100 : 0;
    if (pct >= 70) {
      strengths.push(category);
    } else {
      improvements.push(category);
    }
  }

  // Ensure at least one entry in each
  if (strengths.length === 0) strengths.push('foundational knowledge');
  if (improvements.length === 0) improvements.push('advanced topics');

  return { strengths, improvements };
}

// Submit assessment answers and compute results
export async function submitAssessment(
  assessmentId: string,
  userId: string,
  answers: { questionId: string; answer: string }[],
) {
  const session = assessmentSessions.get(assessmentId);
  if (!session) {
    throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment session not found');
  }
  if (session.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not own this assessment session');
  }

  // Build answer map
  const answerMap = new Map<string, string>();
  for (const a of answers) {
    answerMap.set(a.questionId, a.answer);
  }

  // Score per skill
  const skillBreakdown = SKILL_COMPONENTS.map((skill) => {
    const skillQuestions = session.questions.filter((q) => q.skill === skill);
    const totalForSkill = skillQuestions.length;
    const correctForSkill = skillQuestions.filter(
      (q) => answerMap.get(q.id) === q.correctAnswer,
    ).length;

    const percent = totalForSkill > 0 ? (correctForSkill / totalForSkill) * 100 : 0;
    const level = percentToLevel(percent);
    const { strengths, improvements } = computeFeedback(skillQuestions, answerMap);

    return { skill, level, strengths, improvements };
  });

  // Overall level: average of skill percentages
  const totalQuestions = session.questions.length;
  const totalCorrect = session.questions.filter(
    (q) => answerMap.get(q.id) === q.correctAnswer,
  ).length;
  const overallPercent = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const overallLevel = percentToLevel(overallPercent);

  // Fetch user to get target language
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Store result in DB
  await prisma.assessmentResult.create({
    data: {
      userId,
      languageCode: user.targetLanguageCode,
      overallLevel,
      skillBreakdown: skillBreakdown as any,
    },
  });

  // Clean up session
  assessmentSessions.delete(assessmentId);

  return { overallLevel, skillBreakdown };
}

// Self-select proficiency level
export async function selfSelectLevel(userId: string, level: CEFRLevel) {
  if (!VALID_CEFR_LEVELS.includes(level)) {
    throw new AppError(400, 'INVALID_LEVEL', `Invalid CEFR level: ${level}`);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Create an assessment result representing the self-selected level
  const skillBreakdown = SKILL_COMPONENTS.map((skill) => ({
    skill,
    level,
    strengths: ['self-assessed'],
    improvements: ['take full assessment for detailed feedback'],
  }));

  await prisma.assessmentResult.create({
    data: {
      userId,
      languageCode: user.targetLanguageCode,
      overallLevel: level,
      skillBreakdown: skillBreakdown as any,
    },
  });

  return { overallLevel: level, skillBreakdown };
}
