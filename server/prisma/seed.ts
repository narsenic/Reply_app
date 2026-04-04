import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed default language
  await prisma.language.upsert({
    where: { code: "lb" },
    update: {},
    create: { code: "lb", name: "Luxembourgish", isDefault: true },
  });

  // 2. Seed sample curriculum for A1 level across all 4 skills
  const skills = ["grammar", "reading", "listening", "speaking"] as const;

  for (const skill of skills) {
    const currKey = { languageCode: "lb", level: "A1", skill };
    let curriculum = await prisma.curriculum.findUnique({
      where: { languageCode_level_skill: currKey },
    });

    if (!curriculum) {
      curriculum = await prisma.curriculum.create({
        data: { ...currKey, title: `A1 ${skill.charAt(0).toUpperCase() + skill.slice(1)}` },
      });
    }

    // Check if lessons already exist
    const existingLessons = await prisma.lesson.count({ where: { curriculumId: curriculum.id } });
    if (existingLessons > 0) continue;

    // Create lessons per skill
    if (skill === "grammar") {
      await seedGrammarLessons(curriculum.id);
    } else if (skill === "reading") {
      await seedReadingLessons(curriculum.id);
    } else if (skill === "listening") {
      await seedListeningLessons(curriculum.id);
    } else if (skill === "speaking") {
      await seedSpeakingLessons(curriculum.id);
    }
  }

  // 3. Seed badge definitions
  await seedBadges();

  // 4. Seed 20 chapters for daily_life path (A1 + A2)
  await seedDailyLifeChapters();

  // 5. Seed sproochentest-path chapters at A2 level
  await seedSproochentestChapters();

  // 6. Seed lessons for the first 3 chapters and link via ChapterLesson
  await seedChapterLessons();

  // 7. Seed lessons for chapters 4-20 from PDF content
  await seedChapterLessonsFromPDF();

  console.log("Seed complete: language + A1 curriculum + badges + chapters + chapter lessons created.");
}

async function seedBadges() {
  const badges = [
    { key: "first_chapter", name: "First Chapter", description: "Complete your first chapter", iconUrl: "/badges/first-chapter.svg", criteria: "Complete 1 chapter" },
    { key: "first_quiz", name: "Quiz Master", description: "Pass your first chapter quiz", iconUrl: "/badges/first-quiz.svg", criteria: "Pass 1 chapter quiz" },
    { key: "xp_500", name: "Rising Star", description: "Earn 500 XP", iconUrl: "/badges/xp-500.svg", criteria: "Accumulate 500 XP" },
    { key: "xp_1000", name: "Dedicated Learner", description: "Earn 1000 XP", iconUrl: "/badges/xp-1000.svg", criteria: "Accumulate 1000 XP" },
    { key: "level_complete", name: "Level Up", description: "Complete all chapters in a level", iconUrl: "/badges/level-complete.svg", criteria: "Complete all chapters in a proficiency level" },
    { key: "streak_7", name: "Week Warrior", description: "7-day streak", iconUrl: "/badges/streak-7.svg", criteria: "Maintain a 7-day learning streak" },
    { key: "streak_30", name: "Monthly Champion", description: "30-day streak", iconUrl: "/badges/streak-30.svg", criteria: "Maintain a 30-day learning streak" },
    { key: "streak_100", name: "Century Club", description: "100-day streak", iconUrl: "/badges/streak-100.svg", criteria: "Maintain a 100-day learning streak" },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: { name: badge.name, description: badge.description, iconUrl: badge.iconUrl, criteria: badge.criteria },
      create: badge,
    });
  }
}

interface ChapterDef {
  title: string;
  description: string;
  level: string;
  orderIndex: number;
}

async function seedDailyLifeChapters() {
  const chapters: ChapterDef[] = [
    // A1 chapters (orderIndex 0-9)
    { title: "Nationaliteit", description: "Introducing yourself, saying where you are from, nationalities", level: "A1", orderIndex: 0 },
    { title: "Gefalen", description: "Expressing likes, dislikes, and preferences", level: "A1", orderIndex: 1 },
    { title: "Weidoen", description: "Talking about pain, health issues, and body parts", level: "A1", orderIndex: 2 },
    { title: "Apdikt", description: "At the pharmacy, buying medicine, describing symptoms", level: "A1", orderIndex: 3 },
    { title: "An der Stad", description: "In the city, asking for and giving directions", level: "A1", orderIndex: 4 },
    { title: "Prepo", description: "Prepositions of place and movement", level: "A1", orderIndex: 5 },
    { title: "An der Stad 2", description: "More city vocabulary, shops, and public places", level: "A1", orderIndex: 6 },
    { title: "Mai Program", description: "Daily routine, schedule, telling the time", level: "A1", orderIndex: 7 },
    { title: "Haus", description: "House, rooms, furniture, and household items", level: "A1", orderIndex: 8 },
    { title: "Revisioun", description: "Review and revision of chapters 1 through 9", level: "A1", orderIndex: 9 },
    // A2 chapters (orderIndex 0-9)
    { title: "Perfect mat hunn", description: "Past tense (Perfekt) formed with the auxiliary verb hunn", level: "A2", orderIndex: 0 },
    { title: "Perfect mat sinn", description: "Past tense (Perfekt) formed with the auxiliary verb sinn", level: "A2", orderIndex: 1 },
    { title: "Vakanz", description: "Vacation, travel plans, booking accommodation", level: "A2", orderIndex: 2 },
    { title: "Imperfect", description: "Imperfect tense for narrating past events", level: "A2", orderIndex: 3 },
    { title: "Kleeder", description: "Clothes, fashion, shopping for clothing", level: "A2", orderIndex: 4 },
    { title: "Verglaich", description: "Comparing things, comparative and superlative forms", level: "A2", orderIndex: 5 },
    { title: "Well", description: "Using well (because) to give reasons and explanations", level: "A2", orderIndex: 6 },
    { title: "Wellen", description: "The modal verb wellen (to want), expressing wishes", level: "A2", orderIndex: 7 },
    { title: "Reflexiv Verben 1", description: "Reflexive verbs part 1, daily routine actions", level: "A2", orderIndex: 8 },
    { title: "Reflexiv Verben 2", description: "Reflexive verbs part 2, emotions and reciprocal actions", level: "A2", orderIndex: 9 },
  ];

  for (const ch of chapters) {
    await prisma.chapter.upsert({
      where: {
        level_learningPath_orderIndex: {
          level: ch.level,
          learningPath: "daily_life",
          orderIndex: ch.orderIndex,
        },
      },
      update: {
        title: ch.title,
        description: ch.description,
        published: true,
      },
      create: {
        title: ch.title,
        description: ch.description,
        level: ch.level,
        learningPath: "daily_life",
        orderIndex: ch.orderIndex,
        published: true,
      },
    });
  }

  console.log("Seeded 20 daily_life chapters (10 A1 + 10 A2).");
}

async function seedSproochentestChapters() {
  const chapters: ChapterDef[] = [
    { title: "Sproochentest Heieren", description: "Listening comprehension practice for the Sproochentest exam", level: "A2", orderIndex: 0 },
    { title: "Sproochentest Schwetzen", description: "Speaking practice for the Sproochentest oral exam", level: "A2", orderIndex: 1 },
    { title: "Sproochentest Liesen", description: "Reading comprehension exercises for the Sproochentest", level: "A2", orderIndex: 2 },
    { title: "Sproochentest Schreiwen", description: "Writing practice for the Sproochentest written section", level: "A2", orderIndex: 3 },
    { title: "Sproochentest Mock Examen", description: "Full mock exam simulating the real Sproochentest format", level: "A2", orderIndex: 4 },
  ];

  for (const ch of chapters) {
    await prisma.chapter.upsert({
      where: {
        level_learningPath_orderIndex: {
          level: ch.level,
          learningPath: "sproochentest",
          orderIndex: ch.orderIndex,
        },
      },
      update: {
        title: ch.title,
        description: ch.description,
        published: true,
      },
      create: {
        title: ch.title,
        description: ch.description,
        level: ch.level,
        learningPath: "sproochentest",
        orderIndex: ch.orderIndex,
        published: true,
      },
    });
  }

  console.log("Seeded 5 sproochentest chapters at A2 level.");
}
async function seedGrammarLessons(curriculumId: string) {
  const lessons = [
    {
      title: "Basic Greetings & Introductions",
      order: 0,
      content: [
        { type: "text", body: "<h3>Moien! -- Hello!</h3><p>In Luxembourgish, we greet people with <strong>Moien</strong> (Hello) and say goodbye with <strong>Addi</strong>.</p><p>Other useful phrases:</p><ul><li><strong>Wei geet et?</strong> -- How are you?</li><li><strong>Gutt, merci!</strong> -- Good, thanks!</li><li><strong>Ech heeschen...</strong> -- My name is...</li></ul>", orderIndex: 0 },
      ],
      exercises: [
        { type: "multiple-choice", prompt: "How do you say Hello in Luxembourgish?", options: ["Moien", "Addi", "Merci", "Pardon"], correctAnswer: "Moien", explanation: "Moien is the standard greeting in Luxembourgish.", orderIndex: 0 },
        { type: "multiple-choice", prompt: "What does Addi mean?", options: ["Hello", "Goodbye", "Thank you", "Please"], correctAnswer: "Goodbye", explanation: "Addi means goodbye in Luxembourgish.", orderIndex: 1 },
        { type: "fill-blank", prompt: "Complete: Wei geet ___? (How are you?)", options: null, correctAnswer: "et", explanation: "Wei geet et? means How are you? -- et means it.", orderIndex: 2 },
      ],
    },
    {
      title: "Articles & Gender",
      order: 1,
      content: [
        { type: "text", body: "<h3>Luxembourgish Articles</h3><p>Luxembourgish has three genders: masculine, feminine, and neuter.</p><ul><li><strong>Den</strong> -- the (masculine): den Hond (the dog)</li><li><strong>D'</strong> -- the (feminine): d'Kaz (the cat)</li><li><strong>Dat</strong> -- the (neuter): dat Kand (the child)</li></ul><p>Unlike English, every noun has a gender you need to learn!</p>", orderIndex: 0 },
      ],
      exercises: [
        { type: "multiple-choice", prompt: "Which article is used for masculine nouns?", options: ["Den", "D'", "Dat", "Dem"], correctAnswer: "Den", explanation: "Den is the definite article for masculine nouns.", orderIndex: 0 },
        { type: "multiple-choice", prompt: "Dat Buch -- What gender is Buch (book)?", options: ["Masculine", "Feminine", "Neuter"], correctAnswer: "Neuter", explanation: "Dat indicates neuter gender. Dat Buch = the book.", orderIndex: 1 },
        { type: "multiple-choice", prompt: "How do you say the cat in Luxembourgish?", options: ["den Kaz", "d'Kaz", "dat Kaz", "dem Kaz"], correctAnswer: "d'Kaz", explanation: "Kaz (cat) is feminine, so it uses d' as the article.", orderIndex: 2 },
      ],
    },
    {
      title: "Basic Verb Conjugation",
      order: 2,
      content: [
        { type: "text", body: "<h3>Present Tense Verbs</h3><p>The verb <strong>sinn</strong> (to be) is one of the most important:</p><ul><li><strong>Ech sinn</strong> -- I am</li><li><strong>Du bass</strong> -- You are</li><li><strong>Hien/Hatt ass</strong> -- He/She is</li><li><strong>Mir sinn</strong> -- We are</li></ul><p>The verb <strong>schwatzen</strong> (to speak):</p><ul><li><strong>Ech schwatzen</strong> -- I speak</li><li><strong>Du schwatz</strong> -- You speak</li></ul>", orderIndex: 0 },
      ],
      exercises: [
        { type: "multiple-choice", prompt: "How do you say I am in Luxembourgish?", options: ["Ech sinn", "Du bass", "Hien ass", "Mir sinn"], correctAnswer: "Ech sinn", explanation: "Ech = I, sinn = am. Ech sinn = I am.", orderIndex: 0 },
        { type: "fill-blank", prompt: "Complete: Ech ___ Letzebuergesch. (I speak Luxembourgish)", options: null, correctAnswer: "schwatzen", explanation: "Schwatzen means to speak. With Ech (I), it stays schwatzen.", orderIndex: 1 },
        { type: "multiple-choice", prompt: "What is the correct form: Du ___ Student.", options: ["sinn", "bass", "ass", "si"], correctAnswer: "bass", explanation: "With Du (you), the verb sinn becomes bass.", orderIndex: 2 },
      ],
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: {
        curriculumId,
        title: lesson.title,
        orderIndex: lesson.order,
        content: { create: lesson.content.map((c, i) => ({ type: c.type, body: c.body, orderIndex: c.orderIndex ?? i })) },
        exercises: { create: lesson.exercises.map((e, i) => ({ type: e.type, prompt: e.prompt, options: e.options, correctAnswer: e.correctAnswer, explanation: e.explanation, orderIndex: e.orderIndex ?? i })) },
      },
    });
  }
}

async function seedReadingLessons(curriculumId: string) {
  await prisma.lesson.create({
    data: {
      curriculumId, title: "At the Cafe", orderIndex: 0,
      content: { create: [
        { type: "text", body: "<h3>Am Cafe</h3><p><strong>Anna:</strong> Moien! Ech haett gar ee Kaffi, wann ech gelift.</p><p><strong>Kellner:</strong> Moien! Mat Mellech oder ouni?</p><p><strong>Anna:</strong> Mat Mellech, merci.</p><p><strong>Kellner:</strong> Hei ass Are Kaffi. Dat mecht 3 Euro.</p><p><strong>Anna:</strong> Merci villmools! Addi!</p><hr/><p><em>Vocabulary: Kaffi = coffee, Mellech = milk, ouni = without, merci villmools = thank you very much</em></p>", orderIndex: 0 },
      ]},
      exercises: { create: [
        { type: "multiple-choice", prompt: "What does Anna order?", options: ["Tea", "Coffee", "Water", "Juice"], correctAnswer: "Coffee", explanation: "Kaffi means coffee. Anna says Ech haett gar ee Kaffi (I would like a coffee).", orderIndex: 0 },
        { type: "multiple-choice", prompt: "How does Anna want her coffee?", options: ["Black", "With milk", "With sugar", "Iced"], correctAnswer: "With milk", explanation: "Anna says Mat Mellech which means with milk.", orderIndex: 1 },
        { type: "multiple-choice", prompt: "What does merci villmools mean?", options: ["Goodbye", "Please", "Thank you very much", "You are welcome"], correctAnswer: "Thank you very much", explanation: "Merci villmools = thank you very much (merci = thanks, villmools = many times).", orderIndex: 2 },
      ]},
    },
  });
}

async function seedListeningLessons(curriculumId: string) {
  await prisma.lesson.create({
    data: {
      curriculumId, title: "Everyday Phrases", orderIndex: 0,
      content: { create: [
        { type: "text", body: "Moien! Wei geet et? Ech heeschen Anna. Ech sinn aus Letzebuerg. Ech schwatzen Letzebuergesch an Franseisch. Ech schaffen zu Letzebuerg-Stad. Et geet mir gutt, merci!", orderIndex: 0 },
      ]},
      exercises: { create: [
        { type: "multiple-choice", prompt: "What is the speaker's name?", options: ["Marie", "Anna", "Sophie", "Lisa"], correctAnswer: "Anna", explanation: "The speaker says Ech heeschen Anna (My name is Anna).", orderIndex: 0 },
        { type: "multiple-choice", prompt: "Where is the speaker from?", options: ["France", "Germany", "Luxembourg", "Belgium"], correctAnswer: "Luxembourg", explanation: "Ech sinn aus Letzebuerg = I am from Luxembourg.", orderIndex: 1 },
        { type: "multiple-choice", prompt: "What languages does the speaker speak?", options: ["Luxembourgish and German", "Luxembourgish and French", "French and German", "Only Luxembourgish"], correctAnswer: "Luxembourgish and French", explanation: "Ech schwatzen Letzebuergesch an Franseisch = I speak Luxembourgish and French.", orderIndex: 2 },
      ]},
    },
  });
}

async function seedSpeakingLessons(curriculumId: string) {
  await prisma.lesson.create({
    data: {
      curriculumId, title: "Introduce Yourself", orderIndex: 0,
      content: { create: [
        { type: "text", body: "<h3>Practice introducing yourself</h3><p>Try saying these phrases out loud:</p><ul><li>Moien! (Hello!)</li><li>Ech heeschen... (My name is...)</li><li>Ech sinn aus... (I am from...)</li><li>Ech schwatzen... (I speak...)</li></ul>", orderIndex: 0 },
      ]},
      exercises: { create: [
        { type: "multiple-choice", prompt: "How do you say My name is... in Luxembourgish?", options: ["Ech heeschen...", "Ech sinn...", "Ech schwatzen...", "Ech wunnen..."], correctAnswer: "Ech heeschen...", explanation: "Heeschen means to be called. Ech heeschen = My name is / I am called.", orderIndex: 0 },
        { type: "multiple-choice", prompt: "How do you say I speak Luxembourgish?", options: ["Ech schwatzen Letzebuergesch", "Ech heeschen Letzebuergesch", "Ech sinn Letzebuergesch", "Ech wunnen Letzebuergesch"], correctAnswer: "Ech schwatzen Letzebuergesch", explanation: "Schwatzen = to speak. Ech schwatzen Letzebuergesch = I speak Luxembourgish.", orderIndex: 1 },
      ]},
    },
  });
}
/**
 * Seed lessons for the first 3 daily_life chapters (Nationaliteit, Gefalen, Weidoen)
 * and link them via ChapterLesson join table.
 */
async function seedChapterLessons() {
  const skills = ["grammar", "reading", "listening", "speaking"] as const;

  // Define lesson content for each of the first 3 chapters
  const chapterLessonData: Array<{
    level: string;
    orderIndex: number;
    lessons: Array<{
      skill: string;
      curriculumTitle: string;
      lessonTitle: string;
      content: Array<{ type: string; body: string; orderIndex: number }>;
      exercises: Array<{ type: string; prompt: string; options: string[] | null; correctAnswer: string; explanation: string; orderIndex: number }>;
    }>;
  }> = [
    // ── Chapter 1: Nationaliteit (A1, orderIndex 0) ──
    {
      level: "A1",
      orderIndex: 0,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Nationaliteit Grammar",
          lessonTitle: "Nationality Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Ech sinn... -- I am...</h3><p>To state your nationality in Luxembourgish, use <strong>Ech sinn</strong> followed by the nationality adjective.</p><ul><li><strong>Ech sinn Letzebuerger/Letzebuergesch.</strong> -- I am Luxembourgish (m/f).</li><li><strong>Ech sinn Franséisch.</strong> -- I am French.</li><li><strong>Ech sinn Däitsch.</strong> -- I am German.</li><li><strong>Ech sinn Portugisesch.</strong> -- I am Portuguese.</li></ul><p>To ask someone's nationality: <strong>Wat bass du vun Nationaliteit?</strong></p><p>Note: masculine and feminine forms often differ. E.g. <em>Letzebuerger</em> (m) vs <em>Letzebuergesch</em> (f).</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I am Luxembourgish' (male)?", options: ["Ech sinn Letzebuerger", "Ech sinn Franseisch", "Ech sinn Portugisesch", "Ech sinn Belsch"], correctAnswer: "Ech sinn Letzebuerger", explanation: "Letzebuerger is the masculine nationality adjective for Luxembourgish.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does 'Wat bass du vun Nationaliteit?' mean?", options: ["Where do you live?", "What is your nationality?", "What is your name?", "Where are you from?"], correctAnswer: "What is your nationality?", explanation: "Wat bass du vun Nationaliteit? literally asks about your nationality.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Ech ___ Franseisch. (I am French.)", options: null, correctAnswer: "sinn", explanation: "Ech sinn = I am. The verb sinn is used with Ech.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Nationaliteit Reading",
          lessonTitle: "At the Embassy",
          content: [
            {
              type: "text",
              body: "<h3>Op der Ambassade -- At the Embassy</h3><p><strong>Beamten:</strong> Moien! Wann ech gelift, wéi heescht Dir?</p><p><strong>Maria:</strong> Moien! Ech heeschen Maria Silva.</p><p><strong>Beamten:</strong> A wat ass Är Nationaliteit?</p><p><strong>Maria:</strong> Ech sinn Portugisesch. Ech wunnen awer schonn 5 Joer zu Letzebuerg.</p><p><strong>Beamten:</strong> Schwätzt Dir Letzebuergesch?</p><p><strong>Maria:</strong> Jo, ech schwätzen e bëssen Letzebuergesch an och Franséisch.</p><p><strong>Beamten:</strong> Merci, dat ass gutt!</p><hr/><p><em>Vocabulary: Beamten = official, Ambassade = embassy, wunnen = to live, schonn = already, Joer = years, e bëssen = a little</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is Maria's nationality?", options: ["Luxembourgish", "French", "Portuguese", "German"], correctAnswer: "Portuguese", explanation: "Maria says 'Ech sinn Portugisesch' -- I am Portuguese.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How long has Maria lived in Luxembourg?", options: ["2 years", "3 years", "5 years", "10 years"], correctAnswer: "5 years", explanation: "Maria says 'schonn 5 Joer zu Letzebuerg' -- already 5 years in Luxembourg.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Which languages does Maria speak?", options: ["Only Portuguese", "Luxembourgish and French", "German and French", "Only Luxembourgish"], correctAnswer: "Luxembourgish and French", explanation: "Maria says she speaks 'e bëssen Letzebuergesch an och Franséisch' -- a little Luxembourgish and also French.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Nationaliteit Listening",
          lessonTitle: "Introductions",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Sech virstellen -- Introducing oneself</h3><p>Moien! Ech heeschen Tom. Ech sinn Däitsch, mee ech wunnen zu Letzebuerg. Ech schaffen als Ingenieur. Ech schwätzen Däitsch, Franséisch an e bëssen Letzebuergesch. Ech fannen d'Lëtzebuerger Sprooch ganz flott!</p><hr/><p><em>Vocabulary: mee = but, schaffen = to work, als = as, Ingenieur = engineer, fannen = to find, ganz flott = really nice, Sprooch = language</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is Tom's nationality?", options: ["Luxembourgish", "French", "German", "Belgian"], correctAnswer: "German", explanation: "Tom says 'Ech sinn Däitsch' -- I am German.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What is Tom's profession?", options: ["Teacher", "Doctor", "Engineer", "Chef"], correctAnswer: "Engineer", explanation: "Tom says 'Ech schaffen als Ingenieur' -- I work as an engineer.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "How does Tom describe the Luxembourgish language?", options: ["Difficult", "Really nice", "Boring", "Easy"], correctAnswer: "Really nice", explanation: "'Ganz flott' means really nice/great. Tom finds the language ganz flott.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Nationaliteit Speaking",
          lessonTitle: "Introduce Yourself",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Stell dech vir! -- Introduce yourself!</h3><p>Use these sentence starters to introduce yourself in Luxembourgish:</p><ul><li><strong>Moien! Ech heeschen...</strong> (Hello! My name is...)</li><li><strong>Ech sinn...</strong> (I am... [nationality])</li><li><strong>Ech wunnen zu...</strong> (I live in...)</li><li><strong>Ech schwätzen...</strong> (I speak...)</li><li><strong>Ech schaffen als...</strong> (I work as...)</li></ul><p>Try to form complete sentences about yourself using these patterns.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I live in Luxembourg'?", options: ["Ech wunnen zu Letzebuerg", "Ech schaffen zu Letzebuerg", "Ech sinn zu Letzebuerg", "Ech heeschen Letzebuerg"], correctAnswer: "Ech wunnen zu Letzebuerg", explanation: "Wunnen = to live. Ech wunnen zu Letzebuerg = I live in Luxembourg.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I work as a teacher'?", options: ["Ech wunnen als Enseignant", "Ech schaffen als Enseignant", "Ech sinn als Enseignant", "Ech schwätzen als Enseignant"], correctAnswer: "Ech schaffen als Enseignant", explanation: "Schaffen = to work. Ech schaffen als Enseignant = I work as a teacher.", orderIndex: 1 },
          ],
        },
      ],
    },    // ── Chapter 2: Gefalen (A1, orderIndex 1) ──
    {
      level: "A1",
      orderIndex: 1,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Gefalen Grammar",
          lessonTitle: "Likes and Dislikes Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Gefalen -- To Like</h3><p>In Luxembourgish, expressing likes uses the verb <strong>gefalen</strong> (to please/like):</p><ul><li><strong>Dat gefaellt mir.</strong> -- I like that. (lit: That pleases me.)</li><li><strong>Dat gefaellt mir net.</strong> -- I don't like that.</li><li><strong>Ech hunn gär...</strong> -- I like... (with nouns)</li><li><strong>Ech hunn net gär...</strong> -- I don't like...</li></ul><p>Use <strong>gär</strong> with the verb <strong>hunn</strong> for general preferences: <em>Ech hunn gär Kaffi</em> (I like coffee).</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I like that' in Luxembourgish?", options: ["Dat gefaellt mir", "Ech sinn dat", "Ech hunn dat", "Dat ass gutt"], correctAnswer: "Dat gefaellt mir", explanation: "Dat gefaellt mir = That pleases me / I like that.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I like coffee'?", options: ["Ech sinn gär Kaffi", "Ech hunn gär Kaffi", "Ech gefalen Kaffi", "Ech drénken Kaffi"], correctAnswer: "Ech hunn gär Kaffi", explanation: "Ech hunn gär + noun = I like + noun. Ech hunn gär Kaffi = I like coffee.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Dat gefaellt mir ___. (I don't like that.)", options: null, correctAnswer: "net", explanation: "Net = not. Dat gefaellt mir net = I don't like that.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Gefalen Reading",
          lessonTitle: "Favourite Things",
          content: [
            {
              type: "text",
              body: "<h3>Meng Lieblingssaachen -- My Favourite Things</h3><p><strong>Sophie:</strong> Ech hunn gär Schokolaad an Äis. Mäi Lieblingsessen ass Bouneschlupp!</p><p><strong>Marc:</strong> Ech hunn gär Fussball. Ech spillen all Samschdeg. Mäi Lieblingsfilm ass eng Komödie.</p><p><strong>Sophie:</strong> Ech hunn net gär Fussball, mee ech hunn gär Schwammen.</p><p><strong>Marc:</strong> Schwammen ass och flott!</p><hr/><p><em>Vocabulary: Schokolaad = chocolate, Äis = ice cream, Bouneschlupp = green bean soup (national dish), spillen = to play, all Samschdeg = every Saturday, Schwammen = swimming</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is Sophie's favourite food?", options: ["Chocolate", "Ice cream", "Bouneschlupp", "Pizza"], correctAnswer: "Bouneschlupp", explanation: "Sophie says 'Mäi Lieblingsessen ass Bouneschlupp' -- My favourite food is Bouneschlupp.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "When does Marc play football?", options: ["Every Sunday", "Every Saturday", "Every Friday", "Every day"], correctAnswer: "Every Saturday", explanation: "Marc says 'Ech spillen all Samschdeg' -- I play every Saturday.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What sport does Sophie like?", options: ["Football", "Tennis", "Swimming", "Running"], correctAnswer: "Swimming", explanation: "Sophie says 'Ech hunn gär Schwammen' -- I like swimming.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Gefalen Listening",
          lessonTitle: "What Do You Like?",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Wat hues du gär? -- What do you like?</h3><p>Ech heeschen Lisa. Ech hunn gär Musek, besonnesch Jazz. Ech spillen Klavier zanter 10 Joer. Ech hunn och gär Kachen -- mäi Lieblingsplat ass Judd mat Gaardebounen. Ech hunn net gär fréi opstoen!</p><hr/><p><em>Vocabulary: Musek = music, besonnesch = especially, Klavier = piano, zanter = since/for, Kachen = cooking, Lieblingsplat = favourite dish, Judd mat Gaardebounen = smoked pork with broad beans, fréi opstoen = getting up early</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What instrument does Lisa play?", options: ["Guitar", "Violin", "Piano", "Drums"], correctAnswer: "Piano", explanation: "Lisa says 'Ech spillen Klavier' -- I play piano.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What is Lisa's favourite dish?", options: ["Bouneschlupp", "Judd mat Gaardebounen", "Kniddelen", "Gromperekichelcher"], correctAnswer: "Judd mat Gaardebounen", explanation: "Lisa says her Lieblingsplat is Judd mat Gaardebounen.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does Lisa NOT like?", options: ["Music", "Cooking", "Getting up early", "Jazz"], correctAnswer: "Getting up early", explanation: "Lisa says 'Ech hunn net gär fréi opstoen' -- I don't like getting up early.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Gefalen Speaking",
          lessonTitle: "Express Your Preferences",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Sot wat dir gär hutt! -- Say what you like!</h3><p>Use these patterns to express your preferences:</p><ul><li><strong>Ech hunn gär...</strong> (I like...)</li><li><strong>Ech hunn net gär...</strong> (I don't like...)</li><li><strong>Mäi Lieblingsessen ass...</strong> (My favourite food is...)</li><li><strong>Mäi Lieblingsfilm ass...</strong> (My favourite film is...)</li><li><strong>Dat gefaellt mir!</strong> (I like that!)</li></ul><p>Try talking about your favourite food, sport, music, and hobbies.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'My favourite food is...'?", options: ["Mäi Lieblingsessen ass...", "Ech iessen gär...", "Mäi Essen ass...", "Dat Essen gefaellt mir..."], correctAnswer: "Mäi Lieblingsessen ass...", explanation: "Mäi Lieblingsessen ass... = My favourite food is...", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I don't like that'?", options: ["Dat ass net gutt", "Dat gefaellt mir net", "Ech hunn dat net", "Ech sinn net gär"], correctAnswer: "Dat gefaellt mir net", explanation: "Dat gefaellt mir net = That doesn't please me / I don't like that.", orderIndex: 1 },
          ],
        },
      ],
    },    // ── Chapter 3: Weidoen (A1, orderIndex 2) ──
    {
      level: "A1",
      orderIndex: 2,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Weidoen Grammar",
          lessonTitle: "Health and Pain Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Weidoen -- To Hurt</h3><p>To express pain in Luxembourgish, use <strong>weidoen</strong> (to hurt):</p><ul><li><strong>Mäi Kapp deet mir wéi.</strong> -- My head hurts.</li><li><strong>Mäi Bauch deet mir wéi.</strong> -- My stomach hurts.</li><li><strong>Ech hunn Kappwéi.</strong> -- I have a headache.</li><li><strong>Ech hunn Bauchpéng.</strong> -- I have a stomachache.</li></ul><p>Body parts: <strong>Kapp</strong> (head), <strong>Bauch</strong> (stomach), <strong>Réck</strong> (back), <strong>Been</strong> (leg), <strong>Aarm</strong> (arm), <strong>Zänn</strong> (teeth).</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'My head hurts'?", options: ["Mäi Kapp deet mir wéi", "Ech hunn Kapp", "Mäi Kapp ass gutt", "Ech sinn Kapp"], correctAnswer: "Mäi Kapp deet mir wéi", explanation: "Mäi Kapp deet mir wéi = My head hurts me.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does 'Bauchpéng' mean?", options: ["Headache", "Stomachache", "Backache", "Toothache"], correctAnswer: "Stomachache", explanation: "Bauch = stomach, Péng = pain. Bauchpéng = stomachache.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Ech hunn ___. (I have a headache.)", options: null, correctAnswer: "Kappwéi", explanation: "Kappwéi = headache (Kapp = head, wéi = pain/ache).", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Weidoen Reading",
          lessonTitle: "At the Doctor",
          content: [
            {
              type: "text",
              body: "<h3>Beim Dokter -- At the Doctor</h3><p><strong>Dokter:</strong> Moien! Wat feelt Iech?</p><p><strong>Patient:</strong> Moien Dokter. Mäi Kapp deet mir wéi an ech hunn Féiwer.</p><p><strong>Dokter:</strong> Zanter wéini?</p><p><strong>Patient:</strong> Zanter gëschter. Ech hunn och Halswéi.</p><p><strong>Dokter:</strong> Okay, ech kucken emol. Maacht w.e.g. den Mond op.</p><p><strong>Patient:</strong> Ass et schlëmm?</p><p><strong>Dokter:</strong> Nee, et ass just eng Erkältung. Ech verschreiwen Iech Medikamenter.</p><hr/><p><em>Vocabulary: Wat feelt Iech? = What's wrong?, Féiwer = fever, zanter wéini = since when, gëschter = yesterday, Halswéi = sore throat, Mond = mouth, Erkältung = cold, verschreiwen = to prescribe</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What symptoms does the patient have?", options: ["Headache and fever", "Stomachache", "Broken arm", "Toothache"], correctAnswer: "Headache and fever", explanation: "The patient says 'Mäi Kapp deet mir wéi an ech hunn Féiwer' -- headache and fever.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Since when has the patient been sick?", options: ["Since today", "Since yesterday", "Since last week", "Since Monday"], correctAnswer: "Since yesterday", explanation: "The patient says 'Zanter gëschter' -- since yesterday.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What is the diagnosis?", options: ["Flu", "A cold", "Allergy", "Infection"], correctAnswer: "A cold", explanation: "The doctor says 'Et ass just eng Erkältung' -- It's just a cold.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Weidoen Listening",
          lessonTitle: "Body Parts",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Kierperdeeler -- Body Parts</h3><p>Haut léiere mir Kierperdeeler op Letzebuergesch. De Kapp ass uewen. D'Aen, d'Nues an de Mond sinn am Gesiicht. D'Schëlleren, d'Aarmen an d'Hänn sinn un der Säit. De Bauch ass an der Mëtt. D'Been an d'Féiss sinn ënnen.</p><hr/><p><em>Vocabulary: Kierperdeeler = body parts, haut = today, léiere = to learn, uewen = on top, Aen = eyes, Nues = nose, Gesiicht = face, Schëlleren = shoulders, Hänn = hands, Mëtt = middle, Féiss = feet, ënnen = at the bottom</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does 'Kapp' mean?", options: ["Hand", "Foot", "Head", "Arm"], correctAnswer: "Head", explanation: "Kapp = head. De Kapp ass uewen = The head is on top.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Where are the eyes, nose, and mouth?", options: ["On the hands", "In the face", "On the shoulders", "On the feet"], correctAnswer: "In the face", explanation: "D'Aen, d'Nues an de Mond sinn am Gesiicht -- They are in the face.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does 'Féiss' mean?", options: ["Fingers", "Feet", "Face", "Arms"], correctAnswer: "Feet", explanation: "Féiss = feet. D'Féiss sinn ënnen = The feet are at the bottom.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Weidoen Speaking",
          lessonTitle: "Describe Your Symptoms",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Beschreif deng Symptomer! -- Describe your symptoms!</h3><p>Use these phrases at the doctor:</p><ul><li><strong>Mäi/Meng ... deet mir wéi.</strong> (My ... hurts.)</li><li><strong>Ech hunn Kappwéi/Bauchpéng/Halswéi.</strong> (I have a headache/stomachache/sore throat.)</li><li><strong>Ech hunn Féiwer.</strong> (I have a fever.)</li><li><strong>Ech fillen mech net gutt.</strong> (I don't feel well.)</li><li><strong>Zanter gëschter.</strong> (Since yesterday.)</li></ul><p>Practice describing different symptoms out loud.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I don't feel well'?", options: ["Ech fillen mech net gutt", "Ech sinn net gutt", "Ech hunn net gutt", "Ech ginn net gutt"], correctAnswer: "Ech fillen mech net gutt", explanation: "Fillen = to feel. Ech fillen mech net gutt = I don't feel well.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I have a sore throat'?", options: ["Ech hunn Kappwéi", "Ech hunn Halswéi", "Ech hunn Bauchpéng", "Ech hunn Réckwéi"], correctAnswer: "Ech hunn Halswéi", explanation: "Hals = throat, wéi = pain. Halswéi = sore throat.", orderIndex: 1 },
          ],
        },
      ],
    },
  ];
  // Process each chapter's lessons
  for (const chData of chapterLessonData) {
    const chapter = await prisma.chapter.findFirst({
      where: { level: chData.level, learningPath: "daily_life", orderIndex: chData.orderIndex },
    });
    if (!chapter) continue;

    // Check if chapter already has lessons linked
    const existingLinks = await prisma.chapterLesson.count({ where: { chapterId: chapter.id } });
    if (existingLinks > 0) continue;

    for (let i = 0; i < chData.lessons.length; i++) {
      const lessonDef = chData.lessons[i];

      // Ensure curriculum exists
      const currKey = { languageCode: "lb" as const, level: chData.level, skill: lessonDef.skill };
      let curriculum = await prisma.curriculum.findUnique({ where: { languageCode_level_skill: currKey } });
      if (!curriculum) {
        curriculum = await prisma.curriculum.create({ data: { ...currKey, title: lessonDef.curriculumTitle } });
      }

      // Create lesson
      const lesson = await prisma.lesson.create({
        data: {
          curriculumId: curriculum.id,
          title: lessonDef.lessonTitle,
          orderIndex: i,
          content: { create: lessonDef.content.map((c) => ({ type: c.type, body: c.body, orderIndex: c.orderIndex })) },
          exercises: { create: lessonDef.exercises.map((e) => ({ type: e.type, prompt: e.prompt, options: e.options, correctAnswer: e.correctAnswer, explanation: e.explanation, orderIndex: e.orderIndex })) },
        },
      });

      // Link to chapter
      await prisma.chapterLesson.create({
        data: { chapterId: chapter.id, lessonId: lesson.id, skill: lessonDef.skill, orderIndex: i },
      });
    }
  }

  console.log("Seeded chapter lessons for first 3 chapters.");
}

/**
 * Seed lessons for chapters 4-20 (daily_life) using content extracted from PDF study materials.
 * Chapters 1-3 are already seeded by seedChapterLessons().
 */
async function seedChapterLessonsFromPDF() {
  const chapterLessonData: Array<{
    level: string;
    orderIndex: number;
    lessons: Array<{
      skill: string;
      curriculumTitle: string;
      lessonTitle: string;
      content: Array<{ type: string; body: string; orderIndex: number }>;
      exercises: Array<{ type: string; prompt: string; options: string[] | null; correctAnswer: string; explanation: string; orderIndex: number }>;
    }>;
  }> = [
    // ── Chapter 4: Apdikt (A1, orderIndex 3) ──
    {
      level: "A1",
      orderIndex: 3,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Apdikt Grammar",
          lessonTitle: "At the Pharmacy Grammar",
          content: [
            {
              type: "text",
              body: "<h3>An der Apdikt -- At the Pharmacy</h3><p>In this lesson you will learn vocabulary for the pharmacy and how to describe symptoms.</p><ul><li><strong>Ech hunn den Houscht.</strong> -- I have a cough.</li><li><strong>Ech hunn de Schnapp.</strong> -- I have a runny nose.</li><li><strong>Ech hunn eng Erkaaltung.</strong> -- I have a cold.</li><li><strong>Ech hu mech erkaalt.</strong> -- I have caught a cold.</li><li><strong>Ech hunn Feiwer.</strong> -- I have a fever.</li></ul><p>To ask the pharmacist: <strong>Hutt Dir eppes geint Kappwei?</strong> (Do you have something for a headache?)</p><p>The pharmacist may say: <strong>Dir musst dest Medikament huelen.</strong> (You must take this medication.)</p><p><strong>Demonstrative adjectives:</strong> dest (this, neuter), des (this, feminine), desen (this, masculine).</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I have a cough' in Luxembourgish?", options: ["Ech hunn den Houscht", "Ech hunn de Schnapp", "Ech hunn Feiwer", "Ech hunn Kappwei"], correctAnswer: "Ech hunn den Houscht", explanation: "Den Houscht = the cough. Ech hunn den Houscht = I have a cough.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does 'Hutt Dir eppes geint Kappwei?' mean?", options: ["Do you have something for a headache?", "Do you have a cold?", "Where is the pharmacy?", "How much does it cost?"], correctAnswer: "Do you have something for a headache?", explanation: "Eppes geint = something against/for. Kappwei = headache.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Dir musst ___ Medikament huelen. (You must take this medication.)", options: null, correctAnswer: "dest", explanation: "Dest is the demonstrative adjective for neuter nouns. Dest Medikament = this medication.", orderIndex: 2 },
            { type: "multiple-choice", prompt: "What does 'Ech hu mech erkaalt' mean?", options: ["I have caught a cold", "I am feeling hot", "I have a headache", "I need medicine"], correctAnswer: "I have caught a cold", explanation: "Sech erkalen = to catch a cold. Ech hu mech erkaalt = I have caught a cold.", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Apdikt Reading",
          lessonTitle: "At the Pharmacy Dialogue",
          content: [
            {
              type: "text",
              body: "<h3>An der Apdikt -- At the Pharmacy</h3><p><strong>Apdikter:</strong> Moien! Kann ech Iech hellefen?</p><p><strong>Patient:</strong> Moien! Ech hu mech erkaalt. Ech hunn den Houscht an de Schnapp.</p><p><strong>Apdikter:</strong> Hutt Dir och Feiwer?</p><p><strong>Patient:</strong> Nee, kee Feiwer, mee ech kann net gutt schlofen.</p><p><strong>Apdikter:</strong> Okay. Dir musst des Pellen huelen, drai Mol den Dag. An dest Sirop fir den Houscht.</p><p><strong>Patient:</strong> Merci. Wat kascht dat?</p><p><strong>Apdikter:</strong> Dat mecht 12 Euro.</p><hr/><p><em>Vocabulary: Apdikter = pharmacist, Pellen = pills, Sirop = syrup, drai Mol den Dag = three times a day, Wat kascht dat? = How much does that cost?</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What symptoms does the patient have?", options: ["Cough and runny nose", "Fever and headache", "Stomachache", "Toothache"], correctAnswer: "Cough and runny nose", explanation: "The patient says 'Ech hunn den Houscht an de Schnapp' -- cough and runny nose.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Does the patient have a fever?", options: ["Yes", "No", "A little", "Not mentioned"], correctAnswer: "No", explanation: "The patient says 'Nee, kee Feiwer' -- No, no fever.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "How often should the patient take the pills?", options: ["Once a day", "Twice a day", "Three times a day", "Four times a day"], correctAnswer: "Three times a day", explanation: "The pharmacist says 'drai Mol den Dag' -- three times a day.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Apdikt Listening",
          lessonTitle: "Pharmacy Conversation",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: An der Apdikt</h3><p>Moien! Ech brauch eppes geint Kappwei. Ech hunn zanter geschter Kappwei an ech kann net gutt schlofen. Ech hunn och e bessen Feiwer. Hutt Dir Pellen oder Drepsem? Ech huelen normalerweis Pellen. Merci villmools!</p><hr/><p><em>Vocabulary: brauch = need, zanter geschter = since yesterday, Drepsem = drops, normalerweis = normally</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does the speaker need?", options: ["Something for a headache", "Something for a cough", "Something for a stomachache", "Something for a toothache"], correctAnswer: "Something for a headache", explanation: "The speaker says 'Ech brauch eppes geint Kappwei' -- I need something for a headache.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Since when has the speaker had a headache?", options: ["Since today", "Since yesterday", "Since last week", "Since this morning"], correctAnswer: "Since yesterday", explanation: "Zanter geschter = since yesterday.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What form of medicine does the speaker prefer?", options: ["Drops", "Pills", "Syrup", "Cream"], correctAnswer: "Pills", explanation: "The speaker says 'Ech huelen normalerweis Pellen' -- I normally take pills.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Apdikt Speaking",
          lessonTitle: "Pharmacy Role Play",
          content: [
            {
              type: "text",
              body: "<h3>Practice: An der Apdikt -- At the Pharmacy</h3><p>Practice these pharmacy phrases:</p><ul><li><strong>Ech brauch eppes geint...</strong> (I need something for...)</li><li><strong>Ech hunn den Houscht.</strong> (I have a cough.)</li><li><strong>Ech hunn de Schnapp.</strong> (I have a runny nose.)</li><li><strong>Hutt Dir Pellen?</strong> (Do you have pills?)</li><li><strong>Wat kascht dat?</strong> (How much does that cost?)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you ask 'How much does that cost?'", options: ["Wat kascht dat?", "Wou ass dat?", "Wat ass dat?", "Wien ass dat?"], correctAnswer: "Wat kascht dat?", explanation: "Wat kascht dat? = How much does that cost?", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I need something for a cough'?", options: ["Ech brauch eppes geint den Houscht", "Ech hunn den Houscht gär", "Ech sinn den Houscht", "Ech ginn den Houscht"], correctAnswer: "Ech brauch eppes geint den Houscht", explanation: "Ech brauch eppes geint = I need something for. Den Houscht = the cough.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 5: An der Stad (A1, orderIndex 4) ──
    {
      level: "A1",
      orderIndex: 4,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "An der Stad Grammar",
          lessonTitle: "Directions and Places Grammar",
          content: [
            {
              type: "text",
              body: "<h3>An der Stad -- In the City</h3><p>Learn to ask for and give directions in Luxembourgish.</p><ul><li><strong>Entschellegt, kennt Dir mir soen, wou...?</strong> -- Excuse me, can you tell me where...?</li><li><strong>Wou ass d'Gemeng?</strong> -- Where is the town hall?</li><li><strong>Riichtaus</strong> -- Straight on</li><li><strong>Lenks</strong> -- Left</li><li><strong>Riets</strong> -- Right</li></ul><p>Key places: <strong>d'Gare</strong> (station), <strong>d'Bank</strong> (bank), <strong>d'Gemeng</strong> (town hall), <strong>de Supermarche</strong> (supermarket), <strong>d'Spidol</strong> (hospital).</p><p>The verb <strong>soen</strong> (to say/tell) uses the dative case: <em>Kennt Dir mir soen...</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you politely ask for directions?", options: ["Entschellegt, kennt Dir mir soen, wou...?", "Wou bass du?", "Ech sinn hei", "Gitt mir dat"], correctAnswer: "Entschellegt, kennt Dir mir soen, wou...?", explanation: "Entschellegt = Excuse me. Kennt Dir mir soen = Can you tell me.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does 'riichtaus' mean?", options: ["Left", "Right", "Straight on", "Behind"], correctAnswer: "Straight on", explanation: "Riichtaus = straight on/ahead.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Wou ass ___, w.e.g.? (Where is the station, please?)", options: null, correctAnswer: "d'Gare", explanation: "D'Gare = the station. Wou ass d'Gare? = Where is the station?", orderIndex: 2 },
            { type: "multiple-choice", prompt: "What is 'd'Spidol'?", options: ["The school", "The hospital", "The park", "The bank"], correctAnswer: "The hospital", explanation: "D'Spidol = the hospital (neuter noun).", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "An der Stad Reading",
          lessonTitle: "Asking for Directions",
          content: [
            {
              type: "text",
              body: "<h3>An der Stad -- Asking for Directions</h3><p><strong>Tourist:</strong> Entschellegt, kennt Dir mir soen, wou d'Spidol ass, w.e.g.?</p><p><strong>Passant:</strong> D'Spidol? Hm, ee Moment. Also, Dir gitt riichtaus, dann lenks, dann erem riichtaus an dann riets. Do ass d'Spidol.</p><p><strong>Tourist:</strong> Ass et wait?</p><p><strong>Passant:</strong> Nee, et ass net wait. Ongefeier 5 Minutten.</p><p><strong>Tourist:</strong> Merci villmools!</p><p><strong>Passant:</strong> Keng Ursaach!</p><hr/><p><em>Vocabulary: Passant = passerby, ee Moment = one moment, erem = again, wait = far, ongefeier = approximately, Keng Ursaach = You're welcome</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where does the tourist want to go?", options: ["The station", "The hospital", "The bank", "The supermarket"], correctAnswer: "The hospital", explanation: "The tourist asks 'wou d'Spidol ass' -- where the hospital is.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Is the hospital far away?", options: ["Yes, very far", "No, about 5 minutes", "No, about 10 minutes", "Yes, 30 minutes"], correctAnswer: "No, about 5 minutes", explanation: "The passerby says 'Nee, et ass net wait. Ongefeier 5 Minutten.'", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does 'Keng Ursaach' mean?", options: ["Thank you", "You're welcome", "Goodbye", "Excuse me"], correctAnswer: "You're welcome", explanation: "Keng Ursaach = You're welcome / No problem.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "An der Stad Listening",
          lessonTitle: "City Directions",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Wee an d'Stad</h3><p>Ech sinn an der Stad. Ech sichen de Supermarche. Ech froen eng Fra: Entschellegt, wou ass de Supermarche? Si seet: Dir gitt riichtaus, dann dee zweete Strooss riets. De Supermarche ass op der lenker Sait. Et ass net wait, ongefeier zwou Minutten.</p><hr/><p><em>Vocabulary: sichen = to look for, froen = to ask, Fra = woman, seet = says, zweete Strooss = second street, lenker Sait = left side</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is the speaker looking for?", options: ["The station", "The supermarket", "The hospital", "The bank"], correctAnswer: "The supermarket", explanation: "The speaker says 'Ech sichen de Supermarche' -- I'm looking for the supermarket.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Which street should the speaker turn right on?", options: ["The first street", "The second street", "The third street", "The fourth street"], correctAnswer: "The second street", explanation: "Dee zweete Strooss riets = the second street right.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "On which side is the supermarket?", options: ["Right side", "Left side", "Straight ahead", "Behind"], correctAnswer: "Left side", explanation: "Op der lenker Sait = on the left side.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "An der Stad Speaking",
          lessonTitle: "Give Directions",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Directions in the City</h3><p>Practice giving directions:</p><ul><li><strong>Dir gitt riichtaus.</strong> (You go straight on.)</li><li><strong>Dann lenks/riets.</strong> (Then left/right.)</li><li><strong>Dee eischte/zweete/drette Strooss.</strong> (The first/second/third street.)</li><li><strong>Et ass op der lenker/rietser Sait.</strong> (It's on the left/right side.)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'You go straight on'?", options: ["Dir gitt riichtaus", "Dir gitt lenks", "Dir gitt riets", "Dir gitt heemm"], correctAnswer: "Dir gitt riichtaus", explanation: "Dir gitt riichtaus = You go straight on.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'the first street on the right'?", options: ["Dee eischte Strooss riets", "Dee zweete Strooss lenks", "Dee drette Strooss riichtaus", "Dee eischte Strooss lenks"], correctAnswer: "Dee eischte Strooss riets", explanation: "Dee eischte Strooss riets = the first street on the right.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 6: Prepo (A1, orderIndex 5) ──
    {
      level: "A1",
      orderIndex: 5,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Prepo Grammar",
          lessonTitle: "Prepositions of Place",
          content: [
            {
              type: "text",
              body: "<h3>Prepositiounen -- Prepositions</h3><p>Prepositions describe where things are located. In Luxembourgish, prepositions require either the <strong>dative</strong> or <strong>accusative</strong> case.</p><ul><li><strong>niewent</strong> -- beside: <em>niewent dem Kino</em> (beside the cinema)</li><li><strong>virun</strong> -- in front of: <em>virun der Kierch</em> (in front of the church)</li><li><strong>hannert</strong> -- behind: <em>hannert dem Haus</em> (behind the house)</li><li><strong>tuescht</strong> -- between: <em>tuescht der Bank an dem Kino</em></li><li><strong>iwwer</strong> -- above/over</li><li><strong>enner</strong> -- under/below</li></ul><p><strong>Dative case articles:</strong> dem (masculine/neuter), der (feminine).</p><p>Example: <em>Gett et eng Schwamm nobai?</em> (Is there a swimming pool nearby?)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does 'niewent' mean?", options: ["Beside", "Behind", "In front of", "Above"], correctAnswer: "Beside", explanation: "Niewent = beside. Niewent dem Kino = beside the cinema.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Which article is used for masculine nouns in the dative case?", options: ["Den", "Dem", "Der", "Dat"], correctAnswer: "Dem", explanation: "In the dative case, masculine and neuter nouns use dem.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: D'Post ass niewent ___ Schoul. (The post office is beside the school.)", options: null, correctAnswer: "der", explanation: "Schoul is feminine, so in the dative case it uses der. Niewent der Schoul.", orderIndex: 2 },
            { type: "multiple-choice", prompt: "What does 'Gett et eng Schwamm nobai?' mean?", options: ["Is there a swimming pool nearby?", "Where is the swimming pool?", "Is the pool open?", "Do you like swimming?"], correctAnswer: "Is there a swimming pool nearby?", explanation: "Gett et = Is there, nobai = nearby.", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Prepo Reading",
          lessonTitle: "Where Is Everything?",
          content: [
            {
              type: "text",
              body: "<h3>Wou ass alles? -- Where is everything?</h3><p>Ech wunnen an enger klenger Stad. Meng Wunneng ass niewent der Bäckerei. Virun dem Haus ass e Park. Hannert dem Haus ass eng Schoul. D'Post ass tuescht der Bank an dem Supermarche. D'Spidol ass net wait -- ongefeier 10 Minutten vun hei.</p><hr/><p><em>Vocabulary: kleng = small, Wunneng = apartment, Bäckerei = bakery, Haus = house, tuescht = between</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is beside the bakery?", options: ["The apartment", "The school", "The park", "The hospital"], correctAnswer: "The apartment", explanation: "Meng Wunneng ass niewent der Bäckerei = My apartment is beside the bakery.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What is in front of the house?", options: ["A school", "A park", "A bank", "A supermarket"], correctAnswer: "A park", explanation: "Virun dem Haus ass e Park = In front of the house is a park.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where is the post office?", options: ["Beside the school", "Behind the house", "Between the bank and supermarket", "In front of the park"], correctAnswer: "Between the bank and supermarket", explanation: "D'Post ass tuescht der Bank an dem Supermarche.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Prepo Listening",
          lessonTitle: "Location Descriptions",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Wou ass wat?</h3><p>Ech sichen d'Bibliothéik. Si ass niewent dem Musée. De Musée ass virun der Kierch. Hannert der Kierch ass e grousse Park. An am Park gett et eng Schwamm. D'Schwamm ass tuescht dem Park an der Schoul.</p><hr/><p><em>Vocabulary: Bibliothéik = library, Musée = museum, Kierch = church, grousse = big</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where is the library?", options: ["Beside the museum", "Behind the church", "In the park", "Beside the school"], correctAnswer: "Beside the museum", explanation: "Si ass niewent dem Musée = It is beside the museum.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What is behind the church?", options: ["A museum", "A library", "A big park", "A school"], correctAnswer: "A big park", explanation: "Hannert der Kierch ass e grousse Park = Behind the church is a big park.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where is the swimming pool?", options: ["In the museum", "Between the park and the school", "Behind the library", "In front of the church"], correctAnswer: "Between the park and the school", explanation: "D'Schwamm ass tuescht dem Park an der Schoul.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Prepo Speaking",
          lessonTitle: "Describe Locations",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Describe where things are</h3><p>Use prepositions to describe locations:</p><ul><li><strong>... ass niewent dem/der ...</strong> (... is beside the ...)</li><li><strong>... ass virun dem/der ...</strong> (... is in front of the ...)</li><li><strong>... ass hannert dem/der ...</strong> (... is behind the ...)</li><li><strong>... ass tuescht ... an ...</strong> (... is between ... and ...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'The bank is beside the station'?", options: ["D'Bank ass niewent der Gare", "D'Bank ass hannert der Gare", "D'Bank ass virun der Gare", "D'Bank ass an der Gare"], correctAnswer: "D'Bank ass niewent der Gare", explanation: "Niewent = beside. Der Gare = the station (dative feminine).", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'behind the house'?", options: ["Virun dem Haus", "Niewent dem Haus", "Hannert dem Haus", "Iwwer dem Haus"], correctAnswer: "Hannert dem Haus", explanation: "Hannert = behind. Dem Haus = the house (dative neuter).", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 7: An der Stad 2 (A1, orderIndex 6) ──
    {
      level: "A1",
      orderIndex: 6,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "An der Stad 2 Grammar",
          lessonTitle: "Shops and Opening Hours",
          content: [
            {
              type: "text",
              body: "<h3>D'Butteker -- The Shops</h3><p>Learn about shops, opening hours, and relative pronouns.</p><ul><li><strong>Weini ass d'Bäckerei op?</strong> -- When does the bakery open?</li><li><strong>Weini ass d'Bäckerei zou?</strong> -- When does the bakery close?</li><li><strong>op</strong> = open, <strong>zou</strong> = closed</li></ul><p>Opening hours: <em>De Supermarche ass vu meindes bis samschdes op.</em> (The supermarket is open from Monday to Saturday.)</p><p><strong>Relative pronoun deen:</strong> <em>Gett et hei e Supermarche, deen sonndes op ass?</em> (Is there a supermarket here that is open on Sundays?)</p><p>In a subordinate clause with <strong>deen</strong>, the verb goes to the end.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does 'op' mean in the context of shops?", options: ["Open", "Closed", "Big", "Small"], correctAnswer: "Open", explanation: "Op = open. D'Bäckerei ass op = The bakery is open.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does 'zou' mean?", options: ["Open", "Closed", "Far", "Near"], correctAnswer: "Closed", explanation: "Zou = closed. D'Butteker si sonndes zou = The shops are closed on Sundays.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: De Supermarche ass vu meindes bis ___ op. (Monday to Saturday)", options: null, correctAnswer: "samschdes", explanation: "Samschdes = on Saturdays. Vu meindes bis samschdes = from Monday to Saturday.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "An der Stad 2 Reading",
          lessonTitle: "Shop Opening Hours",
          content: [
            {
              type: "text",
              body: "<h3>D'Butteker an der Stad</h3><p>D'Butteker si sonndes zou. De Supermarche ass vu meindes bis samschdes vun 8 Auer moies bis 7 Auer owes op. D'Schwamm mecht all Dag um 9h30 op, ausser freides moies. Meindes moies ass d'Apdikt zou, mee nomettes ass se vun 13h15 bis 18h00 op.</p><hr/><p><em>Vocabulary: ausser = except, freides = on Fridays, moies = in the morning, nomettes = in the afternoon</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "When are the shops closed?", options: ["On Mondays", "On Sundays", "On Saturdays", "On Fridays"], correctAnswer: "On Sundays", explanation: "D'Butteker si sonndes zou = The shops are closed on Sundays.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "When does the swimming pool NOT open?", options: ["Monday mornings", "Friday mornings", "Saturday mornings", "Sunday mornings"], correctAnswer: "Friday mornings", explanation: "D'Schwamm mecht all Dag um 9h30 op, ausser freides moies.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "When is the pharmacy closed?", options: ["Monday morning", "Monday afternoon", "Friday morning", "Sunday"], correctAnswer: "Monday morning", explanation: "Meindes moies ass d'Apdikt zou = Monday morning the pharmacy is closed.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "An der Stad 2 Listening",
          lessonTitle: "Shopping Information",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Informatiounen iwwer d'Butteker</h3><p>Gett et hei e Supermarche, deen sonndes op ass? Jo, et gett een op der Gare. Mee, en ass nemmen moies op. De Bicherbuttek ass vu meindes bis samschdes op. Hien mecht um 9 Auer op an um 6 Auer owes zou.</p><hr/><p><em>Vocabulary: Bicherbuttek = bookshop, nemmen = only, mecht op = opens, mecht zou = closes</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Is there a supermarket open on Sundays?", options: ["Yes, at the station", "No", "Yes, in the center", "Yes, near the park"], correctAnswer: "Yes, at the station", explanation: "Jo, et gett een op der Gare = Yes, there is one at the station.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "When is the Sunday supermarket open?", options: ["All day", "Only in the morning", "Only in the afternoon", "Only in the evening"], correctAnswer: "Only in the morning", explanation: "En ass nemmen moies op = It is only open in the morning.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "When does the bookshop close?", options: ["5 pm", "6 pm", "7 pm", "8 pm"], correctAnswer: "6 pm", explanation: "Hien mecht um 6 Auer owes zou = It closes at 6 pm.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "An der Stad 2 Speaking",
          lessonTitle: "Ask About Opening Hours",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Ask about shops</h3><ul><li><strong>Weini ass ... op/zou?</strong> (When is ... open/closed?)</li><li><strong>Gett et hei en/eng ...?</strong> (Is there a ... here?)</li><li><strong>Ass et wait?</strong> (Is it far?)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you ask 'When is the bakery open?'", options: ["Weini ass d'Bäckerei op?", "Wou ass d'Bäckerei?", "Wat ass d'Bäckerei?", "Wien ass d'Bäckerei?"], correctAnswer: "Weini ass d'Bäckerei op?", explanation: "Weini = When. Op = open.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you ask 'Is there a bakery here?'", options: ["Gett et hei eng Bäckerei?", "Wou ass d'Bäckerei?", "Weini ass d'Bäckerei op?", "Ech sichen eng Bäckerei"], correctAnswer: "Gett et hei eng Bäckerei?", explanation: "Gett et hei = Is there here. Eng Bäckerei = a bakery.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 8: Mai Program (A1, orderIndex 7) ──
    {
      level: "A1",
      orderIndex: 7,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Mai Program Grammar",
          lessonTitle: "Daily Routine Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Mai Programm -- My Schedule</h3><p>Learn to describe your daily routine and use sequencing adverbs.</p><ul><li><strong>Fir d'eischt</strong> -- First</li><li><strong>Dono / Duerno</strong> -- Afterwards</li><li><strong>Dann</strong> -- Then</li><li><strong>Eier</strong> -- Before</li></ul><p>Example: <em>Fir d'eischt ginn ech op de Maart Gemeis kafen. Dono ginn ech an d'Apdikt.</em></p><p><strong>Verb 2nd position rule:</strong> When starting with an adverb, the verb must be the second element: <em>Dono ginn ech akafen.</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does 'Fir d'eischt' mean?", options: ["First", "Then", "Afterwards", "Finally"], correctAnswer: "First", explanation: "Fir d'eischt = First / Firstly.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does 'Dono' mean?", options: ["Before", "First", "Afterwards", "Never"], correctAnswer: "Afterwards", explanation: "Dono (also Duerno) = afterwards.", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: ___ ginn ech an d'Stad. (Then I go to town.)", options: null, correctAnswer: "Dann", explanation: "Dann = then. Note the verb ginn comes right after (V2 rule).", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Mai Program Reading",
          lessonTitle: "A Day in Town",
          content: [
            {
              type: "text",
              body: "<h3>E Dag an der Stad</h3><p>Sou, ech fueren elo an d'Stad. Fir d'eischt ginn ech gemittlech op de Maart Gemeis, Keis a Blumme kafen. Dono ginn ech an d'Apdikt meng Medikamenter sichen. An dann hunn ech um eng Auer Rendez-vous mam Annick op der Pless. Mir ginn zesummen bei den Inder iessen. Nom Iessen gi mir nach e bessen an d'Stad treppelen. An eier ech heemkommen, ginn ech nach seier an de Supermarche.</p><hr/><p><em>Vocabulary: gemittlech = leisurely, Maart = market, Gemeis = vegetables, Keis = cheese, Blumme = flowers, sichen = to fetch, Rendez-vous = appointment, Pless = Place Guillaume, treppelen = to stroll, heemkommen = to come home</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where does the speaker go first?", options: ["The pharmacy", "The market", "The restaurant", "The supermarket"], correctAnswer: "The market", explanation: "Fir d'eischt ginn ech op de Maart = First I go to the market.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does the speaker buy at the market?", options: ["Vegetables, cheese and flowers", "Bread and milk", "Meat and fish", "Clothes"], correctAnswer: "Vegetables, cheese and flowers", explanation: "Gemeis, Keis a Blumme = vegetables, cheese and flowers.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where do they eat lunch?", options: ["At home", "At the Indian restaurant", "At the market", "At the supermarket"], correctAnswer: "At the Indian restaurant", explanation: "Mir ginn zesummen bei den Inder iessen = We go together to the Indian restaurant to eat.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Mai Program Listening",
          lessonTitle: "Weekend Plans",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Meng Weekend-Plang</h3><p>Samschdeg moies stinn ech um 9 Auer op. Fir d'eischt drénken ech e Kaffi. Dann ginn ech an d'Stad akafen. Ech brauch nei Schong. Nomettes treffen ech meng Frenn am Cafe. Mir schwatzen an drénken Tei. Sonndes bleiwen ech doheem an ech liesen e Buch.</p><hr/><p><em>Vocabulary: opstoen = to get up, akafen = to shop, nei = new, Schong = shoes, treffen = to meet, Frenn = friends, doheem = at home, liesen = to read, Buch = book</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What time does the speaker get up on Saturday?", options: ["7 am", "8 am", "9 am", "10 am"], correctAnswer: "9 am", explanation: "Samschdeg moies stinn ech um 9 Auer op = Saturday morning I get up at 9.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does the speaker need to buy?", options: ["A book", "New shoes", "Groceries", "Clothes"], correctAnswer: "New shoes", explanation: "Ech brauch nei Schong = I need new shoes.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does the speaker do on Sunday?", options: ["Goes shopping", "Meets friends", "Stays home and reads", "Goes to the cinema"], correctAnswer: "Stays home and reads", explanation: "Sonndes bleiwen ech doheem an ech liesen e Buch.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Mai Program Speaking",
          lessonTitle: "Describe Your Day",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Describe your daily routine</h3><ul><li><strong>Fir d'eischt...</strong> (First...)</li><li><strong>Dono/Dann...</strong> (Then/Afterwards...)</li><li><strong>Nom Iessen...</strong> (After lunch...)</li><li><strong>Eier ech heemkommen...</strong> (Before I come home...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'After lunch'?", options: ["Nom Iessen", "Fir d'eischt", "Eier", "Dann"], correctAnswer: "Nom Iessen", explanation: "Nom Iessen = After lunch/eating.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'Before I come home'?", options: ["Eier ech heemkommen", "Dann ech heemkommen", "Nom heemkommen", "Fir d'eischt heemkommen"], correctAnswer: "Eier ech heemkommen", explanation: "Eier = before. Eier ech heemkommen = Before I come home.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 9: Haus (A1, orderIndex 8) ──
    {
      level: "A1",
      orderIndex: 8,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Haus Grammar",
          lessonTitle: "House and Rooms Grammar",
          content: [
            {
              type: "text",
              body: "<h3>D'Haus -- The House</h3><p>Learn rooms and furniture vocabulary with articles.</p><ul><li><strong>d'Stuff</strong> (f) -- living room</li><li><strong>d'Kichen</strong> (f) -- kitchen</li><li><strong>d'Schlofzemmer</strong> (n) -- bedroom</li><li><strong>d'Buedzemmer</strong> (n) -- bathroom</li><li><strong>de Gaart</strong> (m) -- garden</li><li><strong>d'Garage</strong> (f) -- garage</li></ul><p>Describing your home: <em>Meng Wunneng gefaellt mir immens gutt. Si ass um drette Stack an zimlech grouss.</em> (I like my apartment a lot. It is on the third floor and quite big.)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is 'd'Kichen'?", options: ["Kitchen", "Bedroom", "Bathroom", "Living room"], correctAnswer: "Kitchen", explanation: "D'Kichen = the kitchen (feminine noun).", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What is 'd'Schlofzemmer'?", options: ["Living room", "Kitchen", "Bedroom", "Bathroom"], correctAnswer: "Bedroom", explanation: "D'Schlofzemmer = the bedroom (neuter noun).", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Meng Wunneng ass um drette ___. (My apartment is on the third floor.)", options: null, correctAnswer: "Stack", explanation: "Stack = floor/story. Um drette Stack = on the third floor.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Haus Reading",
          lessonTitle: "My New Apartment",
          content: [
            {
              type: "text",
              body: "<h3>Meng nei Wunneng</h3><p><strong>Anna:</strong> Wei gefaellt dir dain neit Appartement?</p><p><strong>Marc:</strong> Meng Wunneng gefaellt mir immens gutt. Si ass um drette Stack an zimlech grouss.</p><p><strong>Anna:</strong> Wei vill Zemmeren hues du dann?</p><p><strong>Marc:</strong> Ech hunn zwee Schlofzemmeren, ee grousst an ee klengt. Dann hunn ech natierlech eng Kichen, eng gemittlech Stuff an e klengt Buedzemmer.</p><p><strong>Anna:</strong> Hues du keng Garage?</p><p><strong>Marc:</strong> Nee, leider net.</p><hr/><p><em>Vocabulary: neit = new, zimlech = quite, grouss = big, gemittlech = cozy, leider = unfortunately</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "On which floor is Marc's apartment?", options: ["First floor", "Second floor", "Third floor", "Ground floor"], correctAnswer: "Third floor", explanation: "Um drette Stack = on the third floor.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How many bedrooms does Marc have?", options: ["One", "Two", "Three", "Four"], correctAnswer: "Two", explanation: "Zwee Schlofzemmeren = two bedrooms.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Does Marc have a garage?", options: ["Yes", "No", "He has two", "Not mentioned"], correctAnswer: "No", explanation: "Marc says 'Nee, leider net' -- No, unfortunately not.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Haus Listening",
          lessonTitle: "House Description",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Meng Haus</h3><p>Ech wunnen an engem Haus mat engem Gaart. Am Erdgeschoss ass eng grouss Kichen an eng Stuff. Um eischte Stack sinn drai Schlofzemmeren an ee Buedzemmer. De Gaart ass hannert dem Haus. Ech hunn och eng Garage fir mein Auto.</p><hr/><p><em>Vocabulary: Erdgeschoss = ground floor, grouss = big, eischte Stack = first floor, drai = three, Auto = car</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where is the kitchen?", options: ["First floor", "Ground floor", "Second floor", "Basement"], correctAnswer: "Ground floor", explanation: "Am Erdgeschoss ass eng grouss Kichen = On the ground floor is a big kitchen.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How many bedrooms are there?", options: ["One", "Two", "Three", "Four"], correctAnswer: "Three", explanation: "Drai Schlofzemmeren = three bedrooms.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where is the garden?", options: ["In front of the house", "Behind the house", "Beside the house", "There is no garden"], correctAnswer: "Behind the house", explanation: "De Gaart ass hannert dem Haus = The garden is behind the house.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Haus Speaking",
          lessonTitle: "Describe Your Home",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Describe your home</h3><ul><li><strong>Ech wunnen an engem Haus/Appartement.</strong></li><li><strong>Ech hunn ... Zemmeren.</strong> (I have ... rooms.)</li><li><strong>Meng Wunneng ass grouss/kleng.</strong> (My apartment is big/small.)</li><li><strong>Ech hunn eng Kichen, eng Stuff, ...</strong></li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I live in a house'?", options: ["Ech wunnen an engem Haus", "Ech sinn an engem Haus", "Ech ginn an engem Haus", "Ech hunn engem Haus"], correctAnswer: "Ech wunnen an engem Haus", explanation: "Wunnen = to live. An engem Haus = in a house.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'My apartment is small'?", options: ["Meng Wunneng ass kleng", "Meng Wunneng ass grouss", "Meng Wunneng ass nei", "Meng Wunneng ass al"], correctAnswer: "Meng Wunneng ass kleng", explanation: "Kleng = small. Meng Wunneng ass kleng = My apartment is small.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 10: Revisioun (A1, orderIndex 9) ──
    {
      level: "A1",
      orderIndex: 9,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Revisioun Grammar",
          lessonTitle: "A1 Review Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Widderhuelung -- Review</h3><p>Review of key grammar from chapters 1-9:</p><ul><li><strong>Verb sinn:</strong> Ech sinn, Du bass, Hien/Hatt ass, Mir sinn</li><li><strong>Verb hunn:</strong> Ech hunn, Du hues, Hien/Hatt huet, Mir hunn</li><li><strong>Gefalen + dative:</strong> Mir gefaellt... (I like...)</li><li><strong>Weidoen:</strong> Mäi Kapp deet mir wei (My head hurts)</li><li><strong>Prepositions + dative:</strong> niewent dem/der, virun dem/der, hannert dem/der</li><li><strong>Adverbs of sequence:</strong> Fir d'eischt, dono, dann</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I like Luxembourg'?", options: ["Letzebuerg gefaellt mir", "Ech sinn Letzebuerg", "Ech hunn Letzebuerg", "Ech ginn Letzebuerg"], correctAnswer: "Letzebuerg gefaellt mir", explanation: "Gefalen + dative: Letzebuerg gefaellt mir = Luxembourg pleases me / I like Luxembourg.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Mäi Bauch deet mir ___. (My stomach hurts.)", options: null, correctAnswer: "wei", explanation: "Weidoen = to hurt. Deet mir wei = hurts me.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What is the correct form: Du ___ Student.", options: ["sinn", "bass", "ass", "si"], correctAnswer: "bass", explanation: "With Du, the verb sinn becomes bass.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Revisioun Reading",
          lessonTitle: "Translation Challenge",
          content: [
            {
              type: "text",
              body: "<h3>Iwwersetzungs-Challenge</h3><p>Read these conversations and test your understanding:</p><p><strong>Conversation 1 -- An der Stad:</strong></p><p>Entschellegt, kennt Dir mir soen, wou et an der Stad e Bicherbuttek gett? -- Natierlech. Et gett een op der Gare. -- A wou genee op der Gare? -- Vis-a-vis vun der Gare ass eng Apdikt. De Bicherbuttek ass nobai.</p><p><strong>Conversation 2 -- Beim Dokter:</strong></p><p>Gudde Moien. Wei geet et Iech? -- Oh, net esou gutt. -- Firwat geet et Iech net esou gutt? -- Majo, ech mengen ech hu mech erkaalt. -- Deet Iech eppes wei? -- Jo, ech hu Kappwei.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "In Conversation 1, where is the bookshop?", options: ["Near the station", "In the park", "Near the school", "In the center"], correctAnswer: "Near the station", explanation: "Et gett een op der Gare = There is one at the station.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "In Conversation 2, what is wrong with the patient?", options: ["Caught a cold", "Broke a leg", "Has a toothache", "Has a fever"], correctAnswer: "Caught a cold", explanation: "Ech hu mech erkaalt = I have caught a cold.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does the patient have?", options: ["A headache", "A stomachache", "A backache", "A toothache"], correctAnswer: "A headache", explanation: "Ech hu Kappwei = I have a headache.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Revisioun Listening",
          lessonTitle: "Review Listening",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Bei Frenn</h3><p>Wei gefaellt dir dain neit Appartement? -- Meng Wunneng gefaellt mir immens gutt. Si ass um drette Stack an zimlech grouss. -- Wei vill Zemmeren hues du dann? -- Majo, ech hunn zwee Schlofzemmeren, ee grousst an ee klengt. Dann hunn ech natierlech eng Kichen, eng gemittlech Stuff an e klengt Buedzemmer. -- Hues du keng Garage? -- Nee, leider net.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How does the speaker feel about the apartment?", options: ["Likes it a lot", "Doesn't like it", "It's okay", "Wants to move"], correctAnswer: "Likes it a lot", explanation: "Meng Wunneng gefaellt mir immens gutt = I like my apartment a lot.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How big is the apartment?", options: ["Very small", "Quite big", "Tiny", "Enormous"], correctAnswer: "Quite big", explanation: "Zimlech grouss = quite big.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does 'leider net' mean?", options: ["Of course", "Unfortunately not", "Maybe", "Absolutely"], correctAnswer: "Unfortunately not", explanation: "Leider = unfortunately. Leider net = unfortunately not.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Revisioun Speaking",
          lessonTitle: "A1 Review Speaking",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Review all A1 topics</h3><p>Combine everything you have learned:</p><ul><li>Introduce yourself (name, nationality, languages)</li><li>Say what you like and don't like</li><li>Describe symptoms at the doctor</li><li>Ask for directions in town</li><li>Describe your home</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you introduce yourself?", options: ["Moien! Ech heeschen... Ech sinn...", "Addi! Ech ginn...", "Merci! Ech hunn...", "Pardon! Ech wunnen..."], correctAnswer: "Moien! Ech heeschen... Ech sinn...", explanation: "Moien = Hello, Ech heeschen = My name is, Ech sinn = I am.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you ask for directions politely?", options: ["Entschellegt, kennt Dir mir soen, wou...?", "Wou bass du?", "Gitt mir dat!", "Ech wëll goen"], correctAnswer: "Entschellegt, kennt Dir mir soen, wou...?", explanation: "Entschellegt = Excuse me. Kennt Dir mir soen = Can you tell me.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 11: Perfect mat hunn (A2, orderIndex 0) ──
    {
      level: "A2",
      orderIndex: 0,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Perfect mat hunn Grammar",
          lessonTitle: "Perfect Tense with hunn",
          content: [
            {
              type: "text",
              body: "<h3>Perfekt mat hunn -- Perfect Tense with hunn</h3><p>The perfect tense is formed with the auxiliary verb <strong>hunn</strong> + past participle (Partizip).</p><p><strong>Regular verbs:</strong> Add <strong>ge-</strong> prefix and <strong>-t</strong> suffix to the root.</p><ul><li>schaffen -> geschafft: <em>Ech hunn de Moie geschafft.</em> (I worked this morning.)</li><li>spillen -> gespillt: <em>Ech hu gespillt.</em> (I played.)</li><li>kachen -> gekacht: <em>Ech hu gëschter gekacht.</em> (I cooked yesterday.)</li></ul><p><strong>Word order:</strong> The past participle goes to the END of the sentence.</p><p><em>Ech hunn zu London gewunnt.</em> (I lived in London.)</p><p><strong>gëschter</strong> = yesterday: <em>Wat hues du gëschter gemaach?</em> (What did you do yesterday?)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you form the past participle of regular verbs?", options: ["ge- + root + -t", "ge- + root + -en", "root + -t", "ge- + root"], correctAnswer: "ge- + root + -t", explanation: "Regular verbs: ge- + root + -t. E.g. schaffen -> ge+schaff+t = geschafft.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Ech hunn de Moie ___. (I worked this morning.)", options: null, correctAnswer: "geschafft", explanation: "Schaffen -> geschafft. Ech hunn de Moie geschafft.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where does the past participle go in the sentence?", options: ["At the beginning", "After the subject", "At the end", "Before hunn"], correctAnswer: "At the end", explanation: "The past participle always goes to the end: Ech hunn de Moie geschafft.", orderIndex: 2 },
            { type: "multiple-choice", prompt: "What does 'Wat hues du gëschter gemaach?' mean?", options: ["What did you do yesterday?", "What are you doing today?", "What will you do tomorrow?", "Where were you yesterday?"], correctAnswer: "What did you do yesterday?", explanation: "Gëschter = yesterday. Gemaach = done (past participle of maachen).", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Perfect mat hunn Reading",
          lessonTitle: "What Did You Do Yesterday?",
          content: [
            {
              type: "text",
              body: "<h3>Wat hues du gëschter gemaach?</h3><p><strong>Anna:</strong> Wat hues du gëschter gemaach?</p><p><strong>Tom:</strong> Ech hu gëschter bis 7 Auer owes geschafft. Dann hunn ech d'Owesiesse gekacht. Ech hu Pasta mat Geméis gemaach.</p><p><strong>Anna:</strong> Hues du och Sport gemaach?</p><p><strong>Tom:</strong> Jo, ech hu moies eng Stonn Tennis gespillt. An du?</p><p><strong>Anna:</strong> Ech hu gëschter net geschafft. Ech hu meng Frenn getraff an mir hunn zesummen e Kaffi gedronk.</p><hr/><p><em>Vocabulary: Owesiesse = dinner, Pasta = pasta, Geméis = vegetables, Stonn = hour, getraff = met (past participle of treffen), gedronk = drunk (past participle of drénken)</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Until what time did Tom work?", options: ["5 pm", "6 pm", "7 pm", "8 pm"], correctAnswer: "7 pm", explanation: "Tom says 'bis 7 Auer owes geschafft' -- worked until 7 pm.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What did Tom cook?", options: ["Pizza", "Pasta with vegetables", "Soup", "Salad"], correctAnswer: "Pasta with vegetables", explanation: "Ech hu Pasta mat Geméis gemaach = I made pasta with vegetables.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What did Anna do yesterday?", options: ["Worked all day", "Met friends and had coffee", "Played tennis", "Cooked dinner"], correctAnswer: "Met friends and had coffee", explanation: "Ech hu meng Frenn getraff an mir hunn e Kaffi gedronk.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Perfect mat hunn Listening",
          lessonTitle: "Past Activities",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Mäi Dag gëschter</h3><p>Gëschter hunn ech vill gemaach. Moies hunn ech eng Stonn Lëtzebuergesch geléiert. Dann hunn ech meng Wunneng geputzt. Nomëttes hunn ech am Supermarché agekaaft. Owes hunn ech e Film gekuckt an ech hu fréi geschlof.</p><hr/><p><em>Vocabulary: geléiert = learned, geputzt = cleaned, agekaaft = shopped, gekuckt = watched, geschlof = slept</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What did the speaker do in the morning?", options: ["Cleaned the apartment", "Studied Luxembourgish", "Went shopping", "Watched a film"], correctAnswer: "Studied Luxembourgish", explanation: "Moies hunn ech eng Stonn Lëtzebuergesch geléiert = In the morning I studied Luxembourgish for an hour.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What did the speaker do in the afternoon?", options: ["Studied", "Cleaned", "Went shopping", "Watched a film"], correctAnswer: "Went shopping", explanation: "Nomëttes hunn ech am Supermarché agekaaft = In the afternoon I went shopping.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What did the speaker do in the evening?", options: ["Studied and cleaned", "Watched a film and slept early", "Went shopping", "Met friends"], correctAnswer: "Watched a film and slept early", explanation: "Owes hunn ech e Film gekuckt an ech hu fréi geschlof.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Perfect mat hunn Speaking",
          lessonTitle: "Talk About Your Past",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Talk about what you did</h3><ul><li><strong>Ech hunn ... geschafft/gekacht/gespillt/geléiert.</strong></li><li><strong>Gëschter hunn ech ...</strong> (Yesterday I ...)</li><li><strong>Wat hues du gëschter gemaach?</strong> (What did you do yesterday?)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I cooked yesterday'?", options: ["Ech hu gëschter gekacht", "Ech kachen gëschter", "Ech wäert gëschter kachen", "Ech kache gëschter"], correctAnswer: "Ech hu gëschter gekacht", explanation: "Perfect tense: Ech hu + gëschter + gekacht (past participle at end).", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I played football'?", options: ["Ech hu Fussball gespillt", "Ech spillen Fussball", "Ech wäert Fussball spillen", "Ech Fussball gespillt"], correctAnswer: "Ech hu Fussball gespillt", explanation: "Spillen -> gespillt. Ech hu Fussball gespillt.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 12: Perfect mat sinn (A2, orderIndex 1) ──
    {
      level: "A2",
      orderIndex: 1,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Perfect mat sinn Grammar",
          lessonTitle: "Perfect Tense with sinn",
          content: [
            {
              type: "text",
              body: "<h3>Perfekt mat sinn -- Perfect Tense with sinn</h3><p>Use <strong>sinn</strong> instead of hunn when there is a <strong>change of place</strong> or <strong>change of state</strong>.</p><p><strong>Change of place:</strong></p><ul><li><em>Ech sinn op London geflunn.</em> (I flew to London.)</li><li><em>Ech si mam Zuch op Paräis gefuer.</em> (I took the train to Paris.)</li><li><em>Meng Kanner sinn an d'Schoul gaang.</em> (My children went to school.)</li></ul><p><strong>Change of state:</strong></p><ul><li><em>Ech sinn ageschlof.</em> (I fell asleep.)</li><li><em>Hien ass erwächt.</em> (He woke up.)</li><li><em>Ech sinn am August gebuer.</em> (I was born in August.)</li></ul><p><strong>Key past participles:</strong> goen->gaang, fléien->geflunn, fueren->gefuer, kommen->komm, opstoen->opgestaan</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "When do you use 'sinn' instead of 'hunn' in the perfect tense?", options: ["Change of place or state", "With all verbs", "Only with regular verbs", "Only in questions"], correctAnswer: "Change of place or state", explanation: "Use sinn when there is a change of place (A to B) or change of state.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Ech ___ op London geflunn. (I flew to London.)", options: null, correctAnswer: "sinn", explanation: "Fléien involves a change of place, so we use sinn.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What is the past participle of 'goen' (to go)?", options: ["Gegoen", "Gaang", "Gegoet", "Gegeet"], correctAnswer: "Gaang", explanation: "Goen -> gaang (irregular). Ech sinn an d'Schoul gaang.", orderIndex: 2 },
            { type: "multiple-choice", prompt: "'Ech sinn ageschlof' means:", options: ["I fell asleep", "I slept well", "I am sleeping", "I woke up"], correctAnswer: "I fell asleep", explanation: "Aschlofen = to fall asleep (change of state: awake -> asleep). Uses sinn.", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Perfect mat sinn Reading",
          lessonTitle: "A Trip to London",
          content: [
            {
              type: "text",
              body: "<h3>Eng Rees op London</h3><p>Leschte Weekend si mir op London geflunn. Mir sinn um 8 Auer moies vum Findel ofgeflunn an owes um 9 Auer zu London ukomm. Mir sinn direkt an d'Hotel gefuer. Den nächsten Dag si mir fréi opgestaan an sinn an d'Stad gaang. Mir sinn vill gelaf an hu vill gesinn. Owes si mir midd an d'Bett gaang.</p><hr/><p><em>Vocabulary: Rees = trip, Findel = Luxembourg airport, ofgeflunn = departed (by plane), ukomm = arrived, gelaf = walked, midd = tired</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How did they travel to London?", options: ["By train", "By car", "By plane", "By bus"], correctAnswer: "By plane", explanation: "Si mir op London geflunn = we flew to London.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What time did they arrive in London?", options: ["8 am", "9 pm", "10 pm", "7 am"], correctAnswer: "9 pm", explanation: "Owes um 9 Auer zu London ukomm = arrived in London at 9 pm.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What did they do the next day?", options: ["Stayed in the hotel", "Got up early and went to town", "Flew back home", "Went shopping"], correctAnswer: "Got up early and went to town", explanation: "Si mir fréi opgestaan an sinn an d'Stad gaang = got up early and went to town.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Perfect mat sinn Listening",
          lessonTitle: "Travel Stories",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Meng Rees</h3><p>Ech si leschte Mount op Paräis gefuer. Ech si mam Zuch gefuer -- et huet 2 Stonnen gedauert. Ech sinn um 10 Auer ukomm. Ech sinn direkt an de Musée gaang. Nomëttes sinn ech duerch d'Stad gelaf. Owes sinn ech an e Restaurant gaang an hunn immens gutt giess.</p><hr/><p><em>Vocabulary: Mount = month, Zuch = train, gedauert = lasted, Stonnen = hours, duerch = through</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How did the speaker travel to Paris?", options: ["By plane", "By train", "By car", "By bus"], correctAnswer: "By train", explanation: "Ech si mam Zuch gefuer = I traveled by train.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How long did the journey take?", options: ["1 hour", "2 hours", "3 hours", "4 hours"], correctAnswer: "2 hours", explanation: "Et huet 2 Stonnen gedauert = It lasted 2 hours.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where did the speaker go first?", options: ["A restaurant", "A museum", "A park", "A shop"], correctAnswer: "A museum", explanation: "Ech sinn direkt an de Musée gaang = I went directly to the museum.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Perfect mat sinn Speaking",
          lessonTitle: "Talk About Trips",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Talk about a trip</h3><ul><li><strong>Ech sinn op ... geflunn/gefuer.</strong> (I flew/traveled to ...)</li><li><strong>Ech sinn um ... Auer ukomm.</strong> (I arrived at ...)</li><li><strong>Ech sinn an ... gaang.</strong> (I went to ...)</li><li><strong>Ech sinn fréi opgestaan.</strong> (I got up early.)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I traveled by train'?", options: ["Ech si mam Zuch gefuer", "Ech hunn mam Zuch gefuer", "Ech si mam Zuch gefahren", "Ech fueren mam Zuch"], correctAnswer: "Ech si mam Zuch gefuer", explanation: "Fueren = to travel. Uses sinn (change of place). Gefuer = past participle.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I arrived at 10 o'clock'?", options: ["Ech sinn um 10 Auer ukomm", "Ech hunn um 10 Auer ukomm", "Ech kommen um 10 Auer", "Ech sinn 10 Auer"], correctAnswer: "Ech sinn um 10 Auer ukomm", explanation: "Kommen -> ukomm. Uses sinn (change of place).", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 13: Vakanz (A2, orderIndex 2) ──
    {
      level: "A2",
      orderIndex: 2,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Vakanz Grammar",
          lessonTitle: "Holiday Vocabulary Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Meng Vakanz -- My Holiday</h3><p>Learn to talk about holidays using the perfect tense.</p><ul><li><strong>Wat hues du an der Vakanz gemaach?</strong> -- What did you do on holiday?</li><li><strong>Mir sinn op ... geflunn.</strong> -- We flew to ...</li><li><strong>Mir sinn dräi Deeg do bliwwen.</strong> -- We stayed there for three days.</li><li><strong>Mir hunn e schéinen Hotel gebucht.</strong> -- We booked a nice hotel.</li></ul><p><strong>Adjective endings:</strong> Before a masculine noun, add -en: <em>e schéinen Hotel</em> (a nice hotel).</p><p><strong>Vocabulary:</strong> bliwwen (stayed, uses sinn!), gebucht (booked), ausgepaakt (unpacked), giess (eaten), gedronk (drunk)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you ask 'What did you do on holiday?' (informal)", options: ["Wat hues du an der Vakanz gemaach?", "Wou waars du an der Vakanz?", "Weini bass du an der Vakanz?", "Wei war deng Vakanz?"], correctAnswer: "Wat hues du an der Vakanz gemaach?", explanation: "Wat hues du gemaach = What did you do. An der Vakanz = on holiday.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Mir sinn dräi Deeg do ___. (We stayed there for three days.)", options: null, correctAnswer: "bliwwen", explanation: "Bliwwen = stayed (past participle of bleiwen). Uses sinn.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Why does 'bleiwen' use 'sinn' in the perfect tense?", options: ["It is an exception", "It involves movement", "It is regular", "It uses hunn"], correctAnswer: "It is an exception", explanation: "Bleiwen is an exception -- although it implies staying, it uses sinn.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Vakanz Reading",
          lessonTitle: "Holiday in Lisbon",
          content: [
            {
              type: "text",
              body: "<h3>Vakanz zu Lissabonn</h3><p>Mäi Mann an ech si leschte Freideg op Lissabonn geflunn a sinn owes um 7 Auer ukomm. Mir sinn dräi Deeg do bliwwen. Mir hunn e schéinen Hotel matzen am Zentrum gebucht. Mir hunn eis Wallis ausgepaakt a sinn direkt an de Restaurant gaang. Mir hunn immens gutt giess an e portugisesche roude Wäin dobäi gedronk. Den nächsten Dag si mir fréi opgestaan an hu Kaffi am Hotel gedronk.</p><hr/><p><em>Vocabulary: matzen = in the middle, Wallis = suitcase, direkt = immediately, roude Wäin = red wine, dobäi = with it</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where did they stay?", options: ["A hostel", "A hotel in the center", "With friends", "An Airbnb"], correctAnswer: "A hotel in the center", explanation: "E schéinen Hotel matzen am Zentrum = a nice hotel in the middle of the center.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What did they do right after arriving?", options: ["Went to sleep", "Went to a restaurant", "Went sightseeing", "Called home"], correctAnswer: "Went to a restaurant", explanation: "Sinn direkt an de Restaurant gaang = went directly to the restaurant.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What did they drink with dinner?", options: ["Beer", "Portuguese red wine", "Water", "Coffee"], correctAnswer: "Portuguese red wine", explanation: "E portugisesche roude Wäin = a Portuguese red wine.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Vakanz Listening",
          lessonTitle: "Holiday Plans",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Meng Vakanz</h3><p>Leschte Summer si mir op Spuenien geflunn. Mir sinn zwou Wochen do bliwwen. Mir hunn eng Wunneng um Mier gebucht. All Dag si mir schwamme gaang. Mir hunn och vill Fësch giess. Et war immens flott!</p><hr/><p><em>Vocabulary: Summer = summer, Spuenien = Spain, Wochen = weeks, Mier = sea, schwamme gaang = went swimming, Fësch = fish</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where did they go on holiday?", options: ["Portugal", "Spain", "France", "Italy"], correctAnswer: "Spain", explanation: "Op Spuenien geflunn = flew to Spain.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How long did they stay?", options: ["One week", "Two weeks", "Three days", "One month"], correctAnswer: "Two weeks", explanation: "Zwou Wochen = two weeks.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What did they do every day?", options: ["Went hiking", "Went swimming", "Went shopping", "Went sightseeing"], correctAnswer: "Went swimming", explanation: "All Dag si mir schwamme gaang = Every day we went swimming.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Vakanz Speaking",
          lessonTitle: "Talk About Your Holiday",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Talk about your holiday</h3><ul><li><strong>Ech sinn op ... geflunn/gefuer.</strong></li><li><strong>Ech sinn ... Deeg/Wochen do bliwwen.</strong></li><li><strong>Ech hunn ... gebucht/giess/gedronk.</strong></li><li><strong>Et war immens flott!</strong> (It was really great!)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'It was really great'?", options: ["Et war immens flott", "Et ass immens flott", "Et gett immens flott", "Et wäert immens flott"], correctAnswer: "Et war immens flott", explanation: "War = was (past tense of sinn). Immens flott = really great.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'We stayed for one week'?", options: ["Mir sinn eng Woch do bliwwen", "Mir hunn eng Woch do bliwwen", "Mir sinn eng Woch do gewunnt", "Mir hunn eng Woch do gebleiwen"], correctAnswer: "Mir sinn eng Woch do bliwwen", explanation: "Bleiwen -> bliwwen. Uses sinn. Eng Woch = one week.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 14: Imperfect (A2, orderIndex 3) ──
    {
      level: "A2",
      orderIndex: 3,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Imperfect Grammar",
          lessonTitle: "Imperfect Tense (Preterit)",
          content: [
            {
              type: "text",
              body: "<h3>Imperfekt -- Imperfect Tense</h3><p>The verbs <strong>sinn</strong> and <strong>hunn</strong> use the imperfect (Preterit) instead of the perfect tense.</p><p><strong>sinn (imperfect):</strong></p><ul><li>ech war, du waars, hien/hatt war, mir waren, dir waart, si waren</li></ul><p><strong>hunn (imperfect):</strong></p><ul><li>ech hat, du has, hien/hatt hat, mir haten, dir hat, si haten</li></ul><p><strong>Time expressions:</strong></p><ul><li><strong>virun engem Joer</strong> -- a year ago</li><li><strong>virun enger Woch</strong> -- a week ago</li><li><strong>fréier</strong> -- earlier/in the past</li><li><strong>deemools</strong> -- at that time</li></ul><p>Example: <em>Wei war dain Weekend?</em> (How was your weekend?)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is the imperfect form of 'sinn' with 'ech'?", options: ["Ech war", "Ech sinn", "Ech bass", "Ech wier"], correctAnswer: "Ech war", explanation: "Ech war = I was (imperfect of sinn).", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Ech ___ virun enger Woch beim Coiffer. (I was at the hairdresser a week ago.)", options: null, correctAnswer: "war", explanation: "War = was. Virun enger Woch = a week ago.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does 'virun engem Joer' mean?", options: ["In one year", "A year ago", "Every year", "Next year"], correctAnswer: "A year ago", explanation: "Virun = ago/before. Engem Joer = one year. Virun engem Joer = a year ago.", orderIndex: 2 },
            { type: "multiple-choice", prompt: "What is the imperfect of 'hunn' with 'ech'?", options: ["Ech hat", "Ech hunn", "Ech hues", "Ech huet"], correctAnswer: "Ech hat", explanation: "Ech hat = I had (imperfect of hunn).", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Imperfect Reading",
          lessonTitle: "How Was Your Weekend?",
          content: [
            {
              type: "text",
              body: "<h3>Wei war dain Weekend?</h3><p><strong>Lisa:</strong> Wei war dain Weekend?</p><p><strong>Marc:</strong> Et war ganz flott! Samschdeg war ech mat menger Fra am Restaurant. Mir ware beim neien Italiener. D'Iessen war immens gutt!</p><p><strong>Lisa:</strong> An wat hues du Sonndes gemaach?</p><p><strong>Marc:</strong> Sonndes war ech doheem. Ech hat keng Energie mei. Ech war midd!</p><hr/><p><em>Vocabulary: ganz flott = really nice, neien = new, Iessen = food, doheem = at home, Energie = energy, midd = tired</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How was Marc's weekend?", options: ["Boring", "Really nice", "Terrible", "Okay"], correctAnswer: "Really nice", explanation: "Et war ganz flott = It was really nice.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Where did Marc go on Saturday?", options: ["To the cinema", "To the Italian restaurant", "To the park", "To a friend's house"], correctAnswer: "To the Italian restaurant", explanation: "Mir ware beim neien Italiener = We were at the new Italian restaurant.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Why did Marc stay home on Sunday?", options: ["It was raining", "He was tired", "He was sick", "He had visitors"], correctAnswer: "He was tired", explanation: "Ech war midd = I was tired.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Imperfect Listening",
          lessonTitle: "Memories",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Fréier</h3><p>Fréier hat keen en Handy. Mir haten en Telefon doheem, mee keen Handy. Deemools war alles anescht. Mir ware vill dobaussen an hu gespillt. Ech war als Kand ëmmer am Bësch oder am Park. Et war eng schéin Zäit!</p><hr/><p><em>Vocabulary: Handy = mobile phone, Telefon = telephone, anescht = different, dobaussen = outside, Bësch = forest, Zäit = time</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What did nobody have in the past?", options: ["A car", "A mobile phone", "A computer", "A television"], correctAnswer: "A mobile phone", explanation: "Fréier hat keen en Handy = In the past nobody had a mobile phone.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What did children do?", options: ["Watched TV", "Played outside a lot", "Used computers", "Stayed inside"], correctAnswer: "Played outside a lot", explanation: "Mir ware vill dobaussen an hu gespillt = We were outside a lot and played.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Where was the speaker as a child?", options: ["At home", "In the forest or park", "At school", "In the city"], correctAnswer: "In the forest or park", explanation: "Ech war als Kand ëmmer am Bësch oder am Park.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Imperfect Speaking",
          lessonTitle: "Talk About the Past",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Talk about the past</h3><ul><li><strong>Wei war dain Weekend/Vakanz?</strong> (How was your weekend/holiday?)</li><li><strong>Et war flott/gutt/net esou gutt.</strong></li><li><strong>Ech war...</strong> (I was...)</li><li><strong>Ech hat...</strong> (I had...)</li><li><strong>Fréier war/hat...</strong> (In the past was/had...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you ask 'How was your weekend?'", options: ["Wei war dain Weekend?", "Wat ass dain Weekend?", "Wou war dain Weekend?", "Wien war dain Weekend?"], correctAnswer: "Wei war dain Weekend?", explanation: "Wei = how. War = was. Dain = your.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I was tired'?", options: ["Ech war midd", "Ech sinn midd", "Ech hat midd", "Ech hunn midd"], correctAnswer: "Ech war midd", explanation: "Ech war midd = I was tired (imperfect of sinn).", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 15: Kleeder (A2, orderIndex 4) ──
    {
      level: "A2",
      orderIndex: 4,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Kleeder Grammar",
          lessonTitle: "Clothes and Colors Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Kleeder -- Clothes</h3><p>Learn clothing vocabulary with genders and adjective endings.</p><p><strong>Feminine:</strong> eng Box (trousers), eng Blus (blouse), eng Jackett (jacket), eng Jupe (skirt), eng Mutz (hat)</p><p><strong>Masculine:</strong> en T-Shirt, e Pullover, e Mantel (coat), e Rack (dress), e Schal (scarf)</p><p><strong>Neuter:</strong> en Hiem (shirt)</p><p><strong>Verbs:</strong></p><ul><li><strong>undoen</strong> (to put on, separable): <em>Ech doen eng Jackett un.</em></li><li><strong>unhunn</strong> (to wear, separable): <em>Hien huet en T-Shirt un.</em></li></ul><p><strong>Adjective endings before nouns:</strong> Masculine: -en (<em>schwaarze Kostüm</em>), Feminine: -  (<em>schwaarz Box</em>), Neuter: -t (<em>waisst Hiem</em>)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does 'unhunn' mean?", options: ["To wear", "To buy", "To wash", "To iron"], correctAnswer: "To wear", explanation: "Unhunn = to wear (literally 'to have on'). Separable verb.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What gender is 'eng Box' (trousers)?", options: ["Masculine", "Feminine", "Neuter", "Plural"], correctAnswer: "Feminine", explanation: "Eng Box = a pair of trousers (feminine singular in Luxembourgish).", orderIndex: 1 },
            { type: "fill-blank", prompt: "Complete: Ech doen eng Jackett ___. (I put on a jacket.)", options: null, correctAnswer: "un", explanation: "Undoen is separable: Ech doen ... un. The prefix un goes to the end.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Kleeder Reading",
          lessonTitle: "What Are You Wearing?",
          content: [
            {
              type: "text",
              body: "<h3>Wat hues du haut un?</h3><p>Mäi Frënd huet haut säi schwaarze Kostüm, säi waisst Hiem a seng schick Schong un. Hien gesäit ganz elegant aus. Ech hunn eng blo Jeansbox, en gréngen T-Shirt an meng nei Turnschlappen un. Am Summer doen ech ëmmer kuerz Boxen un. Am Wanter doen ech e waarme Mantel an eng Mutz un.</p><hr/><p><em>Vocabulary: Kostüm = suit, waisst = white, schick = stylish, Schong = shoes, gesäit aus = looks, elegant = elegant, blo = blue, gréngen = green, Turnschlappen = sneakers, Summer = summer, Wanter = winter, waarm = warm</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is the friend wearing?", options: ["Jeans and t-shirt", "Black suit, white shirt, stylish shoes", "A coat and hat", "Shorts and sandals"], correctAnswer: "Black suit, white shirt, stylish shoes", explanation: "Schwaarze Kostüm, waisst Hiem, schick Schong.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does the speaker wear in summer?", options: ["A warm coat", "Shorts", "A suit", "Boots"], correctAnswer: "Shorts", explanation: "Am Summer doen ech ëmmer kuerz Boxen un = In summer I always put on shorts.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What color is the speaker's t-shirt?", options: ["Blue", "Red", "Green", "White"], correctAnswer: "Green", explanation: "En gréngen T-Shirt = a green t-shirt.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Kleeder Listening",
          lessonTitle: "Shopping for Clothes",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Am Kleederbuttik</h3><p>Ech sichen eng nei Box. Ech probéieren des blo Box un. Si ass ze grouss. Hutt Dir se eng Nummer méi kleng? Jo, hei ass eng. Perfekt, si passt! Wat kascht si? 45 Euro. Ech huelen se.</p><hr/><p><em>Vocabulary: sichen = to look for, probéieren = to try, ze grouss = too big, Nummer = size, méi kleng = smaller, passt = fits, huelen = to take</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is the speaker looking for?", options: ["A new shirt", "New trousers", "A new coat", "New shoes"], correctAnswer: "New trousers", explanation: "Ech sichen eng nei Box = I'm looking for new trousers.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What is the problem with the first pair?", options: ["Too small", "Too big", "Too expensive", "Wrong color"], correctAnswer: "Too big", explanation: "Si ass ze grouss = They are too big.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "How much do the trousers cost?", options: ["35 Euro", "40 Euro", "45 Euro", "50 Euro"], correctAnswer: "45 Euro", explanation: "Wat kascht si? 45 Euro.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Kleeder Speaking",
          lessonTitle: "Describe What You Wear",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Describe clothes</h3><ul><li><strong>Ech hunn ... un.</strong> (I am wearing ...)</li><li><strong>Ech doen ... un.</strong> (I put on ...)</li><li><strong>Ech sichen eng/en ...</strong> (I'm looking for a ...)</li><li><strong>Wat kascht dat?</strong> (How much does that cost?)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I am wearing a blue shirt'?", options: ["Ech hunn e blot Hiem un", "Ech doen e blot Hiem un", "Ech sinn e blot Hiem", "Ech hunn e blot Hiem"], correctAnswer: "Ech hunn e blot Hiem un", explanation: "Unhunn = to wear. E blot Hiem = a blue shirt (neuter).", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'It's too expensive'?", options: ["Et ass ze deier", "Et ass ze grouss", "Et ass ze kleng", "Et ass ze al"], correctAnswer: "Et ass ze deier", explanation: "Ze deier = too expensive.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 16: Verglaich (A2, orderIndex 5) ──
    {
      level: "A2",
      orderIndex: 5,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Verglaich Grammar",
          lessonTitle: "Comparatives Grammar",
          content: [
            {
              type: "text",
              body: "<h3>Verglaich -- Comparisons</h3><p>Learn to compare things using comparative adjectives and the verb <strong>fannen</strong>.</p><p><strong>Comparative:</strong> Add <strong>mei</strong> before the adjective:</p><ul><li>mei schein = more beautiful</li><li>mei deier = more expensive</li><li>mei belleg = cheaper</li></ul><p><strong>Comparison structures:</strong></p><ul><li><strong>mei + adj + wei</strong>: <em>Dei blo Box ass mei flott wei dei gro.</em> (The blue trousers are nicer than the grey ones.)</li><li><strong>grad esou + adj + wei</strong>: <em>Dese Rack ass grad esou kuerz wei d'Jupe.</em> (This dress is as short as the skirt.)</li><li><strong>net esou + adj + wei</strong>: not as ... as</li></ul><p><strong>Irregular:</strong> gutt->besser, gär->leiwer, vill->mei</p><p><strong>Fannen</strong> = to find/think: <em>Ech fannen dese Mantel ganz flott.</em> (I think this coat is very nice.)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'more expensive' in Luxembourgish?", options: ["Mei deier", "Mei belleg", "Mei grouss", "Mei kleng"], correctAnswer: "Mei deier", explanation: "Mei + deier = more expensive.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Dei blo Box ass ___ flott wei dei gro. (The blue ones are nicer than the grey ones.)", options: null, correctAnswer: "mei", explanation: "Mei = more. Mei flott wei = nicer than.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What is the comparative of 'gutt' (good)?", options: ["Mei gutt", "Besser", "Gudder", "Guttst"], correctAnswer: "Besser", explanation: "Gutt -> besser (irregular comparative, like English good -> better).", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Verglaich Reading",
          lessonTitle: "Shopping Opinions",
          content: [
            {
              type: "text",
              body: "<h3>Am Buttik -- In the Shop</h3><p><strong>Anna:</strong> Wei fenns du des waiss Turnschlappen?</p><p><strong>Marc:</strong> Net schlecht, mee ech fannen dei schwaarz Turnschlappen mei schein.</p><p><strong>Anna:</strong> A wei fenns du dei gro Box?</p><p><strong>Marc:</strong> Net schlecht, mee ech fannen dei blo mei flott wei dei gro.</p><p><strong>Anna:</strong> Mee, dei blo ass mei deier wei dei gro.</p><p><strong>Marc:</strong> Ech fannen du hues genuch Boxen!</p><hr/><p><em>Vocabulary: fenns du = do you find/think, net schlecht = not bad, genuch = enough</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Which sneakers does Marc prefer?", options: ["The white ones", "The black ones", "The blue ones", "The grey ones"], correctAnswer: "The black ones", explanation: "Ech fannen dei schwaarz Turnschlappen mei schein = I think the black sneakers are more beautiful.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Which trousers are more expensive?", options: ["The grey ones", "The blue ones", "They cost the same", "The black ones"], correctAnswer: "The blue ones", explanation: "Dei blo ass mei deier wei dei gro = The blue ones are more expensive than the grey ones.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does Marc think about Anna's trousers?", options: ["She needs more", "She has enough", "She should buy new ones", "They are ugly"], correctAnswer: "She has enough", explanation: "Ech fannen du hues genuch Boxen = I think you have enough trousers.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Verglaich Listening",
          lessonTitle: "Comparing Things",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Verglaichen</h3><p>Ech fannen Letzebuerg mei kleng wei Frankraich, mee et ass grad esou schein. D'Iessen zu Letzebuerg ass immens gutt -- ech fannen et besser wei an anere Länner. D'Liewen ass mei deier wei an Daitschland, mee d'Gehälter sinn och mei héich.</p><hr/><p><em>Vocabulary: kleng = small, Frankraich = France, Iessen = food, anere Länner = other countries, Liewen = life, Gehälter = salaries, héich = high</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How does the speaker compare Luxembourg to France?", options: ["Luxembourg is smaller but just as beautiful", "Luxembourg is bigger", "Luxembourg is less beautiful", "They are the same size"], correctAnswer: "Luxembourg is smaller but just as beautiful", explanation: "Mei kleng wei Frankraich, mee grad esou schein = smaller than France but just as beautiful.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How is the food in Luxembourg?", options: ["Bad", "Better than in other countries", "The same as everywhere", "Worse"], correctAnswer: "Better than in other countries", explanation: "Ech fannen et besser wei an anere Länner = I find it better than in other countries.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Is life in Luxembourg expensive?", options: ["No, it's cheap", "Yes, more expensive than Germany", "The same as Germany", "Less expensive"], correctAnswer: "Yes, more expensive than Germany", explanation: "D'Liewen ass mei deier wei an Daitschland = Life is more expensive than in Germany.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Verglaich Speaking",
          lessonTitle: "Express Opinions and Compare",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Compare and give opinions</h3><ul><li><strong>Ech fannen ... mei ... wei ...</strong> (I think ... is more ... than ...)</li><li><strong>... ass grad esou ... wei ...</strong> (... is as ... as ...)</li><li><strong>Ech fannen ... besser/leiwer.</strong> (I think ... is better / I prefer ...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I prefer coffee'?", options: ["Ech drénken leiwer Kaffi", "Ech drénken mei Kaffi", "Ech fannen Kaffi", "Ech hunn gär Kaffi"], correctAnswer: "Ech drénken leiwer Kaffi", explanation: "Leiwer = preferably (comparative of gär). Ech drénken leiwer Kaffi = I prefer to drink coffee.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'as big as'?", options: ["Mei grouss wei", "Grad esou grouss wei", "Net esou grouss wei", "Grouss an"], correctAnswer: "Grad esou grouss wei", explanation: "Grad esou + adjective + wei = as + adjective + as.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 17: Well (A2, orderIndex 6) ──
    {
      level: "A2",
      orderIndex: 6,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Well Grammar",
          lessonTitle: "Because -- Subordinate Clauses",
          content: [
            {
              type: "text",
              body: "<h3>Well -- Because</h3><p><strong>Well</strong> means 'because' and introduces a subordinate clause. The verb goes to the <strong>end</strong> of the subordinate clause.</p><p><strong>Examples:</strong></p><ul><li><em>Ech drenke keng Taass Kaffi, well ech haut frei an d'Bett ginn.</em> (I don't drink coffee because I'm going to bed early today.)</li><li><em>D'Maria leiert Letzebuergesh, well sai Mann Letzebuerger ass.</em> (Maria is learning Luxembourgish because her husband is Luxembourgish.)</li></ul><p><strong>Separable verbs</strong> are NOT separated in a well-clause: <em>...well den Zuch an enger hallwer Stonn fortfiert.</em></p><p><strong>Answering with well:</strong> Firwat? (Why?) -> Well ech keng Zait hunn. (Because I have no time.)</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where does the verb go in a 'well' clause?", options: ["At the beginning", "In the middle", "At the end", "After well"], correctAnswer: "At the end", explanation: "In a subordinate clause with well, the verb goes to the end.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Ech ginn net eraus, well et ___. (I'm not going out because it's raining.)", options: null, correctAnswer: "reent", explanation: "Reent = rains. The verb goes to the end: well et reent.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What happens to separable verbs in a well-clause?", options: ["They stay together (not separated)", "They are separated as usual", "The prefix is dropped", "They become irregular"], correctAnswer: "They stay together (not separated)", explanation: "Separable verbs are NOT separated in subordinate clauses.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Well Reading",
          lessonTitle: "Giving Reasons",
          content: [
            {
              type: "text",
              body: "<h3>Firwat? -- Why?</h3><p><strong>Lisa:</strong> Firwat leiers du Letzebuergesh?</p><p><strong>Tom:</strong> Well ech zu Letzebuerg wunnen an ech d'Sprooch flott fannen.</p><p><strong>Lisa:</strong> Firwat kanns du haut net kommen?</p><p><strong>Tom:</strong> Well ech keng Zait hunn. Ech muss schaffen, well mäi Chef muer e Rapport brauch.</p><p><strong>Lisa:</strong> Okay, da gesinn ech dech muer!</p><hr/><p><em>Vocabulary: leiers = are you learning, Sprooch = language, kommen = to come, Zait = time, Chef = boss, Rapport = report, brauch = needs, gesinn = see</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Why is Tom learning Luxembourgish?", options: ["Because he lives in Luxembourg and likes the language", "Because his wife is Luxembourgish", "For his job", "For an exam"], correctAnswer: "Because he lives in Luxembourg and likes the language", explanation: "Well ech zu Letzebuerg wunnen an ech d'Sprooch flott fannen.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Why can't Tom come today?", options: ["He is sick", "He has no time", "He is on holiday", "He is tired"], correctAnswer: "He has no time", explanation: "Well ech keng Zait hunn = Because I have no time.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "Why does Tom have to work?", options: ["He likes working", "His boss needs a report tomorrow", "He has a meeting", "He is new"], correctAnswer: "His boss needs a report tomorrow", explanation: "Well mäi Chef muer e Rapport brauch = Because my boss needs a report tomorrow.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Well Listening",
          lessonTitle: "Reasons and Explanations",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Grenn</h3><p>Ech kann haut net kommen, well ech muss schaffen. Meng Fra kann och net kommen, well si krank ass. Mir kommen muer, well mir da frai hunn. Ech freeë mech, well ech meng Frenn laang net gesinn hunn!</p><hr/><p><em>Vocabulary: Grenn = reasons, frai hunn = to have free/off, freeë mech = look forward, laang = for a long time</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Why can't the speaker come today?", options: ["He is sick", "He has to work", "He is on holiday", "He has no car"], correctAnswer: "He has to work", explanation: "Well ech muss schaffen = Because I have to work.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "Why can't his wife come?", options: ["She has to work", "She is sick", "She is tired", "She has no time"], correctAnswer: "She is sick", explanation: "Well si krank ass = Because she is sick.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "When will they come?", options: ["Today", "Tomorrow", "Next week", "Never"], correctAnswer: "Tomorrow", explanation: "Mir kommen muer, well mir da frai hunn = We come tomorrow because we have off then.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Well Speaking",
          lessonTitle: "Give Reasons",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Give reasons with well</h3><ul><li><strong>Ech kann net kommen, well ...</strong> (I can't come because ...)</li><li><strong>Ech leieren Letzebuergesh, well ...</strong> (I'm learning Luxembourgish because ...)</li><li><strong>Firwat? Well ...</strong> (Why? Because ...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'because I have no time'?", options: ["Well ech keng Zait hunn", "Well ech Zait hunn", "Ech hunn keng Zait well", "Keng Zait well ech"], correctAnswer: "Well ech keng Zait hunn", explanation: "Well ech keng Zait hunn -- note the verb hunn goes to the end.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'Why?' in Luxembourgish?", options: ["Firwat?", "Well?", "Wou?", "Weini?"], correctAnswer: "Firwat?", explanation: "Firwat = Why.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 18: Wellen (A2, orderIndex 7) ──
    {
      level: "A2",
      orderIndex: 7,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Wellen Grammar",
          lessonTitle: "Modal Verbs kennen and wellen",
          content: [
            {
              type: "text",
              body: "<h3>Wellen an Kennen -- Want and Can</h3><p>Modal verbs <strong>kennen</strong> (can) and <strong>wellen</strong> (to want) are used with an infinitive verb at the end.</p><p><strong>Kennen:</strong></p><ul><li><em>Kennt Dir mir d'Rechnung brengen, w.e.g.?</em> (Can you bring me the bill, please?)</li><li><em>Kanns du mir d'Salz ginn?</em> (Can you give me the salt?)</li><li><em>Kann ech e Kaffi kreien, w.e.g.?</em> (Can I get a coffee, please?)</li></ul><p><strong>Wellen:</strong></p><ul><li><em>Ech well Letzebuergesh leieren.</em> (I want to learn Luxembourgish.)</li><li><em>Wells du mat iessen goen?</em> (Do you want to go eat?)</li></ul><p><strong>Word order:</strong> Modal verb in position 2, infinitive at the end.</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where does the infinitive go with a modal verb?", options: ["At the beginning", "After the modal", "At the end", "Before the subject"], correctAnswer: "At the end", explanation: "With modal verbs, the infinitive goes to the end: Kennt Dir mir d'Rechnung brengen.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Kann ech e Kaffi ___, w.e.g.? (Can I get a coffee, please?)", options: null, correctAnswer: "kreien", explanation: "Kreien = to get/receive. The infinitive goes to the end.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does 'Ech well Letzebuergesh leieren' mean?", options: ["I want to learn Luxembourgish", "I can learn Luxembourgish", "I must learn Luxembourgish", "I am learning Luxembourgish"], correctAnswer: "I want to learn Luxembourgish", explanation: "Wellen = to want. Ech well = I want.", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Wellen Reading",
          lessonTitle: "At the Restaurant",
          content: [
            {
              type: "text",
              body: "<h3>Am Restaurant</h3><p><strong>Kellner:</strong> Gudden Owend! Wat wells du bestellen?</p><p><strong>Tom:</strong> Ech well d'Dagesmenu, w.e.g. An kann ech e Glas Wain kreien?</p><p><strong>Kellner:</strong> Natierlech! Roude oder waisse Wain?</p><p><strong>Tom:</strong> Roude Wain, w.e.g.</p><p><strong>Kellner:</strong> An fir Iech?</p><p><strong>Lisa:</strong> Ech well eng Zopp als Virspais an de Fësch als Haaptplat.</p><p><strong>Tom:</strong> Kennt Dir eis och d'Salz brengen, w.e.g.?</p><p><strong>Kellner:</strong> Natierlech!</p><hr/><p><em>Vocabulary: bestellen = to order, Dagesmenu = daily menu, Glas = glass, Zopp = soup, Virspais = starter, Haaptplat = main course</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does Tom order?", options: ["The daily menu and red wine", "Fish and white wine", "Soup and salad", "Pizza and beer"], correctAnswer: "The daily menu and red wine", explanation: "Ech well d'Dagesmenu... Roude Wain.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does Lisa order as a starter?", options: ["Salad", "Soup", "Bread", "Fish"], correctAnswer: "Soup", explanation: "Ech well eng Zopp als Virspais = I want a soup as a starter.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does Tom ask the waiter to bring?", options: ["The menu", "The bill", "The salt", "More wine"], correctAnswer: "The salt", explanation: "Kennt Dir eis och d'Salz brengen = Can you also bring us the salt.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Wellen Listening",
          lessonTitle: "Making Requests",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Ufroën -- Requests</h3><p>Kann ech d'Kaart kreien, w.e.g.? Ech well eppes bestellen. Ech well eng Taass Tei an e Steck Kuch. Kanns du mir de Zocker ginn? Merci! Kennt Dir mir d'Rechnung brengen, w.e.g.? Ech well bezuelen.</p><hr/><p><em>Vocabulary: Kaart = menu, Taass = cup, Tei = tea, Steck Kuch = piece of cake, Zocker = sugar, bezuelen = to pay</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does the speaker want to order?", options: ["Coffee and cake", "Tea and cake", "Wine and cheese", "Beer and bread"], correctAnswer: "Tea and cake", explanation: "Eng Taass Tei an e Steck Kuch = a cup of tea and a piece of cake.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does the speaker ask a friend for?", options: ["The menu", "The sugar", "The salt", "The bill"], correctAnswer: "The sugar", explanation: "Kanns du mir de Zocker ginn? = Can you give me the sugar? (informal)", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does the speaker want at the end?", options: ["More cake", "To pay", "Another drink", "The menu"], correctAnswer: "To pay", explanation: "Ech well bezuelen = I want to pay.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Wellen Speaking",
          lessonTitle: "Order and Request",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Make requests</h3><ul><li><strong>Kann ech ... kreien, w.e.g.?</strong> (Can I get ...?)</li><li><strong>Ech well ... bestellen.</strong> (I want to order ...)</li><li><strong>Kennt Dir mir ... brengen?</strong> (Can you bring me ...?)</li><li><strong>Kanns du mir ... ginn?</strong> (Can you give me ...?)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you politely ask for the bill?", options: ["Kennt Dir mir d'Rechnung brengen, w.e.g.?", "Gitt mir d'Rechnung!", "Wou ass d'Rechnung?", "Ech well d'Rechnung"], correctAnswer: "Kennt Dir mir d'Rechnung brengen, w.e.g.?", explanation: "Kennt Dir mir ... brengen, w.e.g.? = Can you bring me ..., please?", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I want to order'?", options: ["Ech well bestellen", "Ech kann bestellen", "Ech muss bestellen", "Ech ginn bestellen"], correctAnswer: "Ech well bestellen", explanation: "Ech well = I want. Bestellen = to order.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 19: Reflexiv Verben 1 (A2, orderIndex 8) ──
    {
      level: "A2",
      orderIndex: 8,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Reflexiv Verben 1 Grammar",
          lessonTitle: "Reflexive Verbs Part 1",
          content: [
            {
              type: "text",
              body: "<h3>Reflexiv Verben -- Reflexive Verbs</h3><p>Reflexive verbs describe actions done to oneself. They use reflexive pronouns.</p><p><strong>Reflexive pronouns:</strong></p><ul><li>ech ... mech (myself)</li><li>du ... dech (yourself)</li><li>hien/hatt ... sech (himself/herself)</li><li>mir ... eis (ourselves)</li><li>dir ... iech (yourselves)</li><li>si ... sech (themselves)</li></ul><p><strong>Common reflexive verbs:</strong></p><ul><li><strong>sech waschen</strong>: Ech wasche mech moies um 7 Auer. (I wash myself at 7 am.)</li><li><strong>sech freeën op</strong>: Ech freeë mech op d'Vakanz. (I look forward to the holiday.)</li><li><strong>sech erkalen</strong>: Ech hu mech erkaalt. (I caught a cold.)</li><li><strong>sech erenneren</strong>: Ech erennere mech. (I remember.)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is the reflexive pronoun for 'ech'?", options: ["Mech", "Dech", "Sech", "Eis"], correctAnswer: "Mech", explanation: "Ech ... mech = I ... myself.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Ech wasche ___ moies um 7 Auer. (I wash myself at 7 am.)", options: null, correctAnswer: "mech", explanation: "Mech = myself. Ech wasche mech = I wash myself.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does 'sech freeën op' mean?", options: ["To look forward to", "To be afraid of", "To wash oneself", "To remember"], correctAnswer: "To look forward to", explanation: "Sech freeën op = to look forward to something.", orderIndex: 2 },
            { type: "multiple-choice", prompt: "What is the reflexive pronoun for 'du'?", options: ["Mech", "Dech", "Sech", "Eis"], correctAnswer: "Dech", explanation: "Du ... dech = you ... yourself.", orderIndex: 3 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Reflexiv Verben 1 Reading",
          lessonTitle: "Daily Routine with Reflexive Verbs",
          content: [
            {
              type: "text",
              body: "<h3>Mäi Moien -- My Morning</h3><p>Ech stinn um 7 Auer op. Fir d'eischt wasche mech. Dann doen ech mech un. Ech freeë mech op den Dag! Mäi Mann raseiërt sech am Buedzemmer. Meng Kanner waschen sech an doen sech un. Mir sëtzen eis un den Desch an iessen zesummen.</p><hr/><p><em>Vocabulary: opstoen = to get up, sech undoen = to get dressed, sech raseiëren = to shave, sech sëtzen = to sit down, Desch = table, zesummen = together</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What does the speaker do first?", options: ["Gets dressed", "Washes", "Eats breakfast", "Shaves"], correctAnswer: "Washes", explanation: "Fir d'eischt wasche mech = First I wash myself.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What does the husband do?", options: ["Cooks breakfast", "Shaves", "Goes to work", "Reads the newspaper"], correctAnswer: "Shaves", explanation: "Mäi Mann raseiërt sech = My husband shaves.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What does the family do together?", options: ["Watch TV", "Go for a walk", "Eat together", "Drive to school"], correctAnswer: "Eat together", explanation: "Mir sëtzen eis un den Desch an iessen zesummen = We sit at the table and eat together.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Reflexiv Verben 1 Listening",
          lessonTitle: "Reflexive Verbs in Context",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Reflexiv Verben</h3><p>Ech freeë mech op des Lektioun. Haut leiere mir reflexiv Verben. Sech waschen, sech undoen, sech freeën -- dat sinn alles reflexiv Verben. Ech erennere mech un meng eischt Lektioun. Deemools hat ech Angscht, mee elo freeë mech ëmmer op Letzebuergesh ze leieren!</p><hr/><p><em>Vocabulary: Lektioun = lesson, Angscht = fear/anxiety, deemools = at that time, ëmmer = always</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What is the speaker looking forward to?", options: ["A holiday", "This lesson", "A meal", "A meeting"], correctAnswer: "This lesson", explanation: "Ech freeë mech op des Lektioun = I look forward to this lesson.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How did the speaker feel during the first lesson?", options: ["Happy", "Anxious", "Bored", "Tired"], correctAnswer: "Anxious", explanation: "Deemools hat ech Angscht = At that time I was anxious.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "How does the speaker feel now about learning?", options: ["Still anxious", "Always looks forward to it", "Doesn't like it", "Indifferent"], correctAnswer: "Always looks forward to it", explanation: "Elo freeë mech ëmmer op Letzebuergesh ze leieren = Now I always look forward to learning Luxembourgish.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Reflexiv Verben 1 Speaking",
          lessonTitle: "Talk About Your Routine",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Use reflexive verbs</h3><ul><li><strong>Ech wasche mech um ... Auer.</strong> (I wash at ... o'clock.)</li><li><strong>Ech doen mech un.</strong> (I get dressed.)</li><li><strong>Ech freeë mech op ...</strong> (I look forward to ...)</li><li><strong>Ech erennere mech un ...</strong> (I remember ...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I get dressed'?", options: ["Ech doen mech un", "Ech wasche mech", "Ech freeë mech", "Ech sëtze mech"], correctAnswer: "Ech doen mech un", explanation: "Sech undoen = to get dressed. Ech doen mech un.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I remember'?", options: ["Ech freeë mech", "Ech erennere mech", "Ech wasche mech", "Ech doen mech un"], correctAnswer: "Ech erennere mech", explanation: "Sech erenneren = to remember. Ech erennere mech.", orderIndex: 1 },
          ],
        },
      ],
    },
    // ── Chapter 20: Reflexiv Verben 2 (A2, orderIndex 9) ──
    {
      level: "A2",
      orderIndex: 9,
      lessons: [
        {
          skill: "grammar",
          curriculumTitle: "Reflexiv Verben 2 Grammar",
          lessonTitle: "Reflexive Verbs in the Past",
          content: [
            {
              type: "text",
              body: "<h3>Reflexiv Verben am Perfekt</h3><p>Reflexive verbs in the perfect tense <strong>always use hunn</strong> (never sinn).</p><p><strong>Structure:</strong> Subject + hunn + reflexive pronoun + ... + past participle</p><ul><li><em>Ech hu mech gewäsch.</em> (I washed myself.)</li><li><em>Ech hu mech mam Sarah getraff.</em> (I met up with Sarah.)</li><li><em>D'Elteren hu sech em hir Kanner gekemmert.</em> (The parents took care of their children.)</li><li><em>Den Henri huet sech geschter Owend iwwer de Kameidi geiergert.</em> (Henri got annoyed about the noise yesterday evening.)</li></ul><p><strong>Key verbs:</strong> sech treffen->getraff, sech kemmeren->gekemmert, sech iergeren->geiergert, sech freeën->gefreet, sech entspaanen->entspaant</p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Which auxiliary verb do reflexive verbs use in the perfect tense?", options: ["Always hunn", "Always sinn", "Sometimes hunn, sometimes sinn", "Neither"], correctAnswer: "Always hunn", explanation: "Reflexive verbs in the perfect tense always use hunn.", orderIndex: 0 },
            { type: "fill-blank", prompt: "Complete: Ech ___ mech mam Sarah getraff. (I met up with Sarah.)", options: null, correctAnswer: "hu", explanation: "Hu = have (short form of hunn). Reflexive verbs always use hunn in the past.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What is the past participle of 'sech treffen'?", options: ["Getroffen", "Getraff", "Getreff", "Getraffet"], correctAnswer: "Getraff", explanation: "Sech treffen -> getraff (irregular past participle).", orderIndex: 2 },
          ],
        },
        {
          skill: "reading",
          curriculumTitle: "Reflexiv Verben 2 Reading",
          lessonTitle: "What Happened Yesterday",
          content: [
            {
              type: "text",
              body: "<h3>Geschter</h3><p>Geschter hu mech um 10 Auer virum Kino mam Sarah getraff. Mir hu eis e Film ugekuckt. No dem Film hu mir eis an e Cafe gesat an hu geschwat. Den Henri huet sech geschter Owend vill iwwer de Kameidi geiergert. Hien huet sech bei de Noper beschwéiert. Mee um Enn huet hien sech berouegt an ass an d'Bett gaang.</p><hr/><p><em>Vocabulary: virum = in front of, ugekuckt = watched, gesat = sat down, geschwat = chatted, Kameidi = noise, Noper = neighbor, beschwéiert = complained, berouegt = calmed down, um Enn = in the end</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "Where did the speaker meet Sarah?", options: ["At a cafe", "In front of the cinema", "At the station", "At home"], correctAnswer: "In front of the cinema", explanation: "Virum Kino = in front of the cinema.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What was Henri annoyed about?", options: ["The weather", "The noise", "The food", "The traffic"], correctAnswer: "The noise", explanation: "Den Henri huet sech iwwer de Kameidi geiergert = Henri got annoyed about the noise.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What did Henri do in the end?", options: ["Called the police", "Calmed down and went to bed", "Moved away", "Got more angry"], correctAnswer: "Calmed down and went to bed", explanation: "Hien huet sech berouegt an ass an d'Bett gaang = He calmed down and went to bed.", orderIndex: 2 },
          ],
        },
        {
          skill: "listening",
          curriculumTitle: "Reflexiv Verben 2 Listening",
          lessonTitle: "Reflexive Verbs in Past Tense",
          content: [
            {
              type: "text",
              body: "<h3>Transcript: Mäi Weekend</h3><p>Ech hu mech gutt entspaant dëst Weekend. Samschdeg hu mech mat Frenn getraff. Mir hu eis immens gutt amuséiert. Sonndes hu mech doheem entspaant. Ech hu mech op de Sofa gesat an e Buch gelies. Ech hu mech op des Woch gefreet!</p><hr/><p><em>Vocabulary: entspaant = relaxed, amuséiert = had fun, Sofa = sofa, gelies = read (past), Woch = week</em></p>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "What did the speaker do on Saturday?", options: ["Stayed home", "Met friends", "Went shopping", "Worked"], correctAnswer: "Met friends", explanation: "Samschdeg hu mech mat Frenn getraff = Saturday I met with friends.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "What did the speaker do on Sunday?", options: ["Met friends again", "Relaxed at home", "Went to the cinema", "Played sports"], correctAnswer: "Relaxed at home", explanation: "Sonndes hu mech doheem entspaant = Sunday I relaxed at home.", orderIndex: 1 },
            { type: "multiple-choice", prompt: "What is the speaker looking forward to?", options: ["The weekend", "This week", "The holiday", "A party"], correctAnswer: "This week", explanation: "Ech hu mech op des Woch gefreet = I looked forward to this week.", orderIndex: 2 },
          ],
        },
        {
          skill: "speaking",
          curriculumTitle: "Reflexiv Verben 2 Speaking",
          lessonTitle: "Talk About Past Experiences",
          content: [
            {
              type: "text",
              body: "<h3>Practice: Reflexive verbs in the past</h3><ul><li><strong>Ech hu mech ... getraff.</strong> (I met ...)</li><li><strong>Ech hu mech ... entspaant.</strong> (I relaxed ...)</li><li><strong>Ech hu mech ... gefreet.</strong> (I looked forward to ...)</li><li><strong>Ech hu mech ... geiergert.</strong> (I got annoyed about ...)</li></ul>",
              orderIndex: 0,
            },
          ],
          exercises: [
            { type: "multiple-choice", prompt: "How do you say 'I relaxed well'?", options: ["Ech hu mech gutt entspaant", "Ech sinn mech gutt entspaant", "Ech hu gutt entspaant", "Ech war gutt entspaant"], correctAnswer: "Ech hu mech gutt entspaant", explanation: "Reflexive verbs use hunn in the past. Ech hu mech gutt entspaant.", orderIndex: 0 },
            { type: "multiple-choice", prompt: "How do you say 'I got annoyed about the noise'?", options: ["Ech hu mech iwwer de Kameidi geiergert", "Ech sinn iwwer de Kameidi geiergert", "Ech hu de Kameidi geiergert", "Ech war iwwer de Kameidi geiergert"], correctAnswer: "Ech hu mech iwwer de Kameidi geiergert", explanation: "Sech iergeren iwwer = to get annoyed about. Uses hunn + mech.", orderIndex: 1 },
          ],
        },
      ],
    },
  ];

  // Process each chapter's lessons
  for (const chData of chapterLessonData) {
    const chapter = await prisma.chapter.findFirst({
      where: { level: chData.level, learningPath: "daily_life", orderIndex: chData.orderIndex },
    });
    if (!chapter) continue;

    // Check if chapter already has lessons linked
    const existingLinks = await prisma.chapterLesson.count({ where: { chapterId: chapter.id } });
    if (existingLinks > 0) continue;

    for (let i = 0; i < chData.lessons.length; i++) {
      const lessonDef = chData.lessons[i];

      // Ensure curriculum exists
      const currKey = { languageCode: "lb" as const, level: chData.level, skill: lessonDef.skill };
      let curriculum = await prisma.curriculum.findUnique({ where: { languageCode_level_skill: currKey } });
      if (!curriculum) {
        curriculum = await prisma.curriculum.create({ data: { ...currKey, title: lessonDef.curriculumTitle } });
      }

      // Create lesson
      const lesson = await prisma.lesson.create({
        data: {
          curriculumId: curriculum.id,
          title: lessonDef.lessonTitle,
          orderIndex: i,
          content: { create: lessonDef.content.map((c) => ({ type: c.type, body: c.body, orderIndex: c.orderIndex })) },
          exercises: { create: lessonDef.exercises.map((e) => ({ type: e.type, prompt: e.prompt, options: e.options, correctAnswer: e.correctAnswer, explanation: e.explanation, orderIndex: e.orderIndex })) },
        },
      });

      // Link to chapter
      await prisma.chapterLesson.create({
        data: { chapterId: chapter.id, lessonId: lesson.id, skill: lessonDef.skill, orderIndex: i },
      });
    }
  }

  console.log("Seeded chapter lessons for chapters 4-20 from PDF content.");
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
