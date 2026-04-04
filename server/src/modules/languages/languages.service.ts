import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

export async function listLanguages() {
  const languages = await prisma.language.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return {
    languages: languages.map((lang) => ({
      code: lang.code,
      name: lang.name,
      isDefault: lang.isDefault,
    })),
  };
}

export async function addLanguage(code: string, name: string) {
  const existing = await prisma.language.findUnique({ where: { code } });
  if (existing) {
    throw new AppError(409, 'LANGUAGE_EXISTS', `Language with code "${code}" already exists`);
  }

  const language = await prisma.language.create({
    data: { code, name, isDefault: false },
  });

  return { code: language.code, name: language.name, isDefault: language.isDefault };
}

export type LearningPath = 'sproochentest' | 'daily_life';

const VALID_LEARNING_PATHS: LearningPath[] = ['sproochentest', 'daily_life'];

export async function setLearningPath(userId: string, learningPath: LearningPath) {
  if (!VALID_LEARNING_PATHS.includes(learningPath)) {
    throw new AppError(400, 'INVALID_LEARNING_PATH', 'Learning path must be "sproochentest" or "daily_life"');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Preserve progress on path switch — no deletion of ChapterProgress records
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { learningPath },
    select: {
      id: true,
      email: true,
      displayName: true,
      targetLanguageCode: true,
      learningPath: true,
      totalXp: true,
    },
  });

  return updated;
}

export async function switchUserLanguage(userId: string, languageCode: string) {
  const language = await prisma.language.findUnique({ where: { code: languageCode } });
  if (!language) {
    throw new AppError(404, 'LANGUAGE_NOT_FOUND', `Language "${languageCode}" not found`);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { targetLanguageCode: languageCode },
  });

  return {
    userId: updated.id,
    targetLanguageCode: updated.targetLanguageCode,
    message: `Target language switched to ${language.name}`,
  };
}
