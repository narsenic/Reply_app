import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

const ORAL_PRODUCTION_TIME_LIMIT = 600; // 10 minutes in seconds
const LISTENING_TIME_LIMIT = 300; // 5 minutes in seconds

interface MockExamSection {
  section: string;
  score: number;
  feedback: string;
}

/**
 * Get topic cards for a given level, organized for Sproochentest practice.
 */
export async function getTopicCards(level: string) {
  const prompts = await prisma.speakingPrompt.findMany({
    where: {
      learningPath: 'sproochentest',
      chapter: { level },
    },
    include: {
      chapter: { select: { title: true, level: true } },
    },
    orderBy: { difficulty: 'asc' },
  });

  return {
    topicCards: prompts.map((p) => ({
      id: p.id,
      topic: p.topic,
      suggestedVocabulary: p.suggestedVocabulary,
      guidingQuestions: p.guidingQuestions,
      difficulty: p.difficulty,
      chapterTitle: p.chapter.title,
      level: p.chapter.level,
    })),
    total: prompts.length,
  };
}

/**
 * Get a mock exam combining oral production + listening comprehension.
 */
export async function getMockExam(level: string) {
  // Get oral production prompts (speaking prompts from sproochentest path)
  const oralPrompts = await prisma.speakingPrompt.findMany({
    where: {
      learningPath: 'sproochentest',
      chapter: { level },
    },
    take: 3,
  });

  // Get listening comprehension exercises (quiz questions of type listening-comprehension)
  const listeningQuestions = await prisma.quizQuestion.findMany({
    where: {
      skill: 'listening',
      quiz: {
        chapter: {
          level,
          learningPath: 'sproochentest',
        },
      },
    },
    take: 5,
  });

  return {
    examId: `mock-${Date.now()}`,
    level,
    sections: [
      {
        section: 'oral_production',
        timeLimitSeconds: ORAL_PRODUCTION_TIME_LIMIT,
        prompts: oralPrompts.map((p) => ({
          id: p.id,
          topic: p.topic,
          suggestedVocabulary: p.suggestedVocabulary,
          guidingQuestions: p.guidingQuestions,
        })),
      },
      {
        section: 'listening_comprehension',
        timeLimitSeconds: LISTENING_TIME_LIMIT,
        questions: listeningQuestions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          audioUrl: q.audioUrl,
        })),
      },
    ],
  };
}

/**
 * Submit a mock exam for scoring.
 */
export async function submitMockExam(
  userId: string,
  examData: {
    oralProductionScore: number;
    listeningAnswers: { questionId: string; answer: string }[];
  },
) {
  // Score oral production (self-evaluated, 0-100)
  const oralScore = Math.min(100, Math.max(0, examData.oralProductionScore));

  // Score listening comprehension
  let listeningCorrect = 0;
  const totalListening = examData.listeningAnswers.length;

  if (totalListening > 0) {
    const questionIds = examData.listeningAnswers.map((a) => a.questionId);
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    for (const answer of examData.listeningAnswers) {
      const question = questionMap.get(answer.questionId);
      if (question && answer.answer === question.correctAnswer) {
        listeningCorrect++;
      }
    }
  }

  const listeningScore = totalListening > 0
    ? Math.round((listeningCorrect / totalListening) * 100)
    : 0;

  const sections: MockExamSection[] = [
    {
      section: 'oral_production',
      score: oralScore,
      feedback: oralScore >= 70
        ? 'Good oral production skills. Continue practicing with varied topics.'
        : 'Focus on expanding vocabulary and practicing structured responses to topic cards.',
    },
    {
      section: 'listening_comprehension',
      score: listeningScore,
      feedback: listeningScore >= 70
        ? 'Strong listening comprehension. Keep practicing with native audio at normal speed.'
        : 'Practice listening to native audio more frequently. Try shadowing exercises to improve comprehension.',
    },
  ];

  const overallScore = Math.round((oralScore + listeningScore) / 2);

  return {
    overallScore,
    passed: overallScore >= 70,
    sections,
  };
}

/**
 * Get timed practice session configuration.
 */
export async function getTimedPractice(level: string, section: 'oral_production' | 'listening_comprehension') {
  if (section === 'oral_production') {
    const prompts = await prisma.speakingPrompt.findMany({
      where: {
        learningPath: 'sproochentest',
        chapter: { level },
      },
      take: 1,
    });

    return {
      section,
      timeLimitSeconds: ORAL_PRODUCTION_TIME_LIMIT,
      prompt: prompts[0] ? {
        id: prompts[0].id,
        topic: prompts[0].topic,
        suggestedVocabulary: prompts[0].suggestedVocabulary,
        guidingQuestions: prompts[0].guidingQuestions,
      } : null,
    };
  }

  // Listening comprehension
  const questions = await prisma.quizQuestion.findMany({
    where: {
      skill: 'listening',
      quiz: {
        chapter: {
          level,
          learningPath: 'sproochentest',
        },
      },
    },
    take: 5,
  });

  return {
    section,
    timeLimitSeconds: LISTENING_TIME_LIMIT,
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      audioUrl: q.audioUrl,
    })),
  };
}
