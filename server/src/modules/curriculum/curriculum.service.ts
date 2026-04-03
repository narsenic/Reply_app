import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SkillComponent = 'grammar' | 'reading' | 'listening' | 'speaking';

export const VALID_CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const VALID_SKILLS: SkillComponent[] = ['grammar', 'reading', 'listening', 'speaking'];

export interface ContentBlockInput {
  type: string;
  body?: string;
  fileUrl?: string;
  orderIndex: number;
}

export interface CreateLessonInput {
  targetLanguage: string;
  level: CEFRLevel;
  skill: SkillComponent;
  title: string;
  order: number;
  content: ContentBlockInput[];
}

export interface UpdateLessonInput {
  title?: string;
  content?: ContentBlockInput[];
}

// List curriculum with optional filters
export async function listCurriculum(filters: {
  language?: string;
  level?: string;
  skill?: string;
}) {
  const where: any = {};

  if (filters.language) {
    where.languageCode = filters.language;
  }
  if (filters.level) {
    if (!VALID_CEFR_LEVELS.includes(filters.level as CEFRLevel)) {
      throw new AppError(400, 'INVALID_LEVEL', `Invalid CEFR level: ${filters.level}. Must be one of: ${VALID_CEFR_LEVELS.join(', ')}`);
    }
    where.level = filters.level;
  }
  if (filters.skill) {
    if (!VALID_SKILLS.includes(filters.skill as SkillComponent)) {
      throw new AppError(400, 'INVALID_SKILL', `Invalid skill: ${filters.skill}. Must be one of: ${VALID_SKILLS.join(', ')}`);
    }
    where.skill = filters.skill;
  }

  const curricula = await prisma.curriculum.findMany({
    where,
    include: {
      lessons: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          title: true,
          orderIndex: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const lessons = curricula.flatMap((c) =>
    c.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      orderIndex: l.orderIndex,
      level: c.level,
      skill: c.skill,
      languageCode: c.languageCode,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
  );

  return { lessons, total: lessons.length };
}

// Create a lesson — find-or-create the Curriculum record first
export async function createLesson(input: CreateLessonInput) {
  // Validate language exists
  const language = await prisma.language.findUnique({
    where: { code: input.targetLanguage },
  });
  if (!language) {
    throw new AppError(404, 'LANGUAGE_NOT_FOUND', `Language not found: ${input.targetLanguage}`);
  }

  // Find or create curriculum
  let curriculum = await prisma.curriculum.findUnique({
    where: {
      languageCode_level_skill: {
        languageCode: input.targetLanguage,
        level: input.level,
        skill: input.skill,
      },
    },
  });

  if (!curriculum) {
    curriculum = await prisma.curriculum.create({
      data: {
        languageCode: input.targetLanguage,
        level: input.level,
        skill: input.skill,
        title: `${input.level} ${input.skill}`,
      },
    });
  }

  // Create lesson with content blocks
  const lesson = await prisma.lesson.create({
    data: {
      curriculumId: curriculum.id,
      title: input.title,
      orderIndex: input.order,
      content: {
        create: input.content.map((block) => ({
          type: block.type,
          body: block.body ?? null,
          fileUrl: block.fileUrl ?? null,
          orderIndex: block.orderIndex,
        })),
      },
    },
    include: {
      content: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return lesson;
}


// Update a lesson
export async function updateLesson(lessonId: string, input: UpdateLessonInput) {
  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!existing) {
    throw new AppError(404, 'LESSON_NOT_FOUND', `Lesson not found: ${lessonId}`);
  }

  const updateData: any = {};
  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: updateData,
    include: {
      content: { orderBy: { orderIndex: 'asc' } },
    },
  });

  // If content blocks are provided, replace them
  if (input.content !== undefined) {
    await prisma.contentBlock.deleteMany({ where: { lessonId } });
    await prisma.contentBlock.createMany({
      data: input.content.map((block) => ({
        lessonId,
        type: block.type,
        body: block.body ?? null,
        fileUrl: block.fileUrl ?? null,
        orderIndex: block.orderIndex,
      })),
    });
  }

  // Re-fetch with updated content
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      content: { orderBy: { orderIndex: 'asc' } },
    },
  });
}

// Delete a lesson
export async function deleteLesson(lessonId: string) {
  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!existing) {
    throw new AppError(404, 'LESSON_NOT_FOUND', `Lesson not found: ${lessonId}`);
  }

  // Delete content blocks first, then the lesson
  await prisma.contentBlock.deleteMany({ where: { lessonId } });
  await prisma.exercise.deleteMany({ where: { lessonId } });
  await prisma.lesson.delete({ where: { id: lessonId } });

  return { message: 'Lesson deleted successfully' };
}

// Reorder lessons by array of IDs
export async function reorderLessons(lessonIds: string[]) {
  // Validate all IDs exist
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } },
  });

  if (lessons.length !== lessonIds.length) {
    const foundIds = new Set(lessons.map((l) => l.id));
    const missing = lessonIds.filter((id) => !foundIds.has(id));
    throw new AppError(400, 'LESSONS_NOT_FOUND', `Lessons not found: ${missing.join(', ')}`);
  }

  // Update order indices in a transaction
  await prisma.$transaction(
    lessonIds.map((id, index) =>
      prisma.lesson.update({
        where: { id },
        data: { orderIndex: index },
      }),
    ),
  );

  return { message: 'Lessons reordered successfully' };
}
