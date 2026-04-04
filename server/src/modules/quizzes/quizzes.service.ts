import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';
import { awardXP, updateStreak, checkAndAwardBadges } from '../gamification/gamification.service';

interface SubmitAnswer {
  questionId: string;
  answer: string;
}

/**
 * Get quiz questions for a chapter. Enforces unlock check:
 * allSectionsComplete must be true in ChapterProgress.
 */
export async function getQuiz(userId: string, chapterId: string) {
  const quiz = await prisma.chapterQuiz.findUnique({
    where: { chapterId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!quiz) {
    throw new AppError(404, 'QUIZ_NOT_FOUND', `No quiz found for chapter: ${chapterId}`);
  }

  // Enforce unlock check
  const progress = await prisma.chapterProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  if (!progress || !progress.allSectionsComplete) {
    throw new AppError(403, 'QUIZ_NOT_UNLOCKED', 'Complete all chapter sections before taking the quiz');
  }

  return {
    quizId: quiz.id,
    chapterId,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      skill: q.skill,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? undefined,
      audioUrl: q.audioUrl ?? undefined,
      referenceAudioUrl: q.referenceAudioUrl ?? undefined,
    })),
  };
}


/**
 * Submit quiz answers. Calculates score as round((correct/total)*100),
 * determines pass/fail at 70%, stores QuizAttempt, tracks highest score.
 * On pass: marks ChapterProgress.quizPassed = true, unlocks next chapter.
 * On fail: returns incorrect answers with explanations.
 */
export async function submitQuiz(userId: string, chapterId: string, answers: SubmitAnswer[]) {
  const quiz = await prisma.chapterQuiz.findUnique({
    where: { chapterId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
      chapter: {
        select: { level: true, learningPath: true, orderIndex: true },
      },
    },
  });

  if (!quiz) {
    throw new AppError(404, 'QUIZ_NOT_FOUND', `No quiz found for chapter: ${chapterId}`);
  }

  // Enforce unlock check
  const progress = await prisma.chapterProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  if (!progress || !progress.allSectionsComplete) {
    throw new AppError(403, 'QUIZ_NOT_UNLOCKED', 'Complete all chapter sections before taking the quiz');
  }

  // Build a map of questionId -> question for grading
  const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
  const totalQuestions = quiz.questions.length;

  let correctCount = 0;
  const incorrectAnswers: {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[] = [];

  // Build skill breakdown tracking
  const skillBreakdown = new Map<string, { correct: number; total: number }>();
  for (const q of quiz.questions) {
    if (!skillBreakdown.has(q.skill)) {
      skillBreakdown.set(q.skill, { correct: 0, total: 0 });
    }
    skillBreakdown.get(q.skill)!.total++;
  }

  // Grade each answer
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  for (const question of quiz.questions) {
    const userAnswer = answerMap.get(question.id) ?? '';
    if (userAnswer === question.correctAnswer) {
      correctCount++;
      skillBreakdown.get(question.skill)!.correct++;
    } else {
      incorrectAnswers.push({
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }
  }

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= 70;

  // Store the attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId,
      score,
      passed,
      answers: answers as any,
    },
  });

  // Get all attempts for this user/quiz to compute highest score and attempt count
  const allAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, userId },
    orderBy: { completedAt: 'asc' },
  });

  const highestScore = Math.max(...allAttempts.map((a) => a.score));

  // On pass: mark quizPassed and unlock next chapter
  let xpGained = 0;
  let newBadges: string[] = [];

  if (passed) {
    await prisma.chapterProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { quizPassed: true },
    });

    // --- Gamification: award XP for quiz pass, update streak, check badges ---
    try {
      const xpResult = await awardXP(userId, 'quiz_pass');
      xpGained = xpResult.xpGained;

      await updateStreak(userId);

      const badgeResult = await checkAndAwardBadges(userId);
      newBadges = badgeResult.newBadges;
    } catch {
      // Gamification failures should not break quiz submission
    }
  }

  return {
    score,
    passed,
    attempts: allAttempts.length,
    highestScore,
    xpGained,
    newBadges,
    breakdown: Array.from(skillBreakdown.entries()).map(([skill, data]) => ({
      skill,
      correct: data.correct,
      total: data.total,
    })),
    incorrectAnswers: passed ? [] : incorrectAnswers,
  };
}

/**
 * Get quiz attempt history for a user and chapter, with highest score.
 */
export async function getQuizHistory(userId: string, chapterId: string) {
  const quiz = await prisma.chapterQuiz.findUnique({
    where: { chapterId },
  });

  if (!quiz) {
    throw new AppError(404, 'QUIZ_NOT_FOUND', `No quiz found for chapter: ${chapterId}`);
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, userId },
    orderBy: { completedAt: 'asc' },
  });

  const highestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score))
    : 0;

  return {
    attempts: attempts.map((a, index) => ({
      attemptNumber: index + 1,
      score: a.score,
      passed: a.passed,
      completedAt: a.completedAt.toISOString(),
    })),
    highestScore,
  };
}
