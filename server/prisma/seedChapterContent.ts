import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ChapterContentDef {
  chapterTitle: string;
  level: string;
  learningPath: string;
  grammar: {
    title: string;
    content: string;
    exercises: Array<{ type: string; prompt: string; options: string[] | null; correctAnswer: string; explanation: string }>;
  };
  reading: {
    title: string;
    content: string;
    exercises: Array<{ type: string; prompt: string; options: string[] | null; correctAnswer: string; explanation: string }>;
  };
}

async function getOrCreateCurriculum(level: string, skill: string, title: string) {
  const key = { languageCode: "lb" as const, level, skill };
  let curr = await prisma.curriculum.findUnique({ where: { languageCode_level_skill: key } });
  if (!curr) {
    curr = await prisma.curriculum.create({ data: { ...key, title } });
  }
  return curr;
}

async function seedOneChapter(def: ChapterContentDef) {
  const chapter = await prisma.chapter.findFirst({
    where: { title: def.chapterTitle, level: def.level, learningPath: def.learningPath },
  });
  if (!chapter) {
    console.log(`  Chapter not found: ${def.chapterTitle} (${def.level}) - skipping`);
    return;
  }

  // Check if this chapter already has grammar+reading lessons linked
  const existing = await prisma.chapterLesson.count({ where: { chapterId: chapter.id, skill: { in: ["grammar", "reading"] } } });
  if (existing >= 2) {
    console.log(`  Chapter "${def.chapterTitle}" already has content - skipping`);
    return;
  }

  // --- Grammar Lesson ---
  const grammarCurr = await getOrCreateCurriculum(def.level, "grammar", `${def.level} Grammar`);
  const maxGrammarOrder = await prisma.lesson.aggregate({ where: { curriculumId: grammarCurr.id }, _max: { orderIndex: true } });
  const grammarOrder = (maxGrammarOrder._max.orderIndex ?? -1) + 1;

  const grammarLesson = await prisma.lesson.create({
    data: {
      curriculumId: grammarCurr.id,
      title: def.grammar.title,
      orderIndex: grammarOrder,
      content: { create: [{ type: "text", body: def.grammar.content, orderIndex: 0 }] },
      exercises: {
        create: def.grammar.exercises.map((e, i) => ({
          type: e.type, prompt: e.prompt, options: e.options,
          correctAnswer: e.correctAnswer, explanation: e.explanation, orderIndex: i,
        })),
      },
    },
  });

  await prisma.chapterLesson.create({
    data: { chapterId: chapter.id, lessonId: grammarLesson.id, skill: "grammar", orderIndex: 0 },
  });

  // --- Reading Lesson ---
  const readingCurr = await getOrCreateCurriculum(def.level, "reading", `${def.level} Reading`);
  const maxReadingOrder = await prisma.lesson.aggregate({ where: { curriculumId: readingCurr.id }, _max: { orderIndex: true } });
  const readingOrder = (maxReadingOrder._max.orderIndex ?? -1) + 1;

  const readingLesson = await prisma.lesson.create({
    data: {
      curriculumId: readingCurr.id,
      title: def.reading.title,
      orderIndex: readingOrder,
      content: { create: [{ type: "text", body: def.reading.content, orderIndex: 0 }] },
      exercises: {
        create: def.reading.exercises.map((e, i) => ({
          type: e.type, prompt: e.prompt, options: e.options,
          correctAnswer: e.correctAnswer, explanation: e.explanation, orderIndex: i,
        })),
      },
    },
  });

  await prisma.chapterLesson.create({
    data: { chapterId: chapter.id, lessonId: readingLesson.id, skill: "reading", orderIndex: 1 },
  });

  console.log(`  ✓ ${def.chapterTitle}: grammar + reading lessons created`);
}

