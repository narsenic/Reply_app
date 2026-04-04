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

  await seedChapters();
  console.log("Seed complete: language + A1 curriculum + badges + chapters created.");
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
async function seedChapters() {
  const chData = [
    {t:'Nationality',d:'Introducing yourself, nationalities',l:'A1',o:0},
    {t:'Gefalen',d:'Expressing likes and preferences',l:'A1',o:1},
    {t:'Weidoen',d:'Health and body vocabulary',l:'A1',o:2},
    {t:'Apdikt',d:'At the pharmacy',l:'A1',o:3},
    {t:'An der Stad',d:'In the city, directions',l:'A1',o:4},
    {t:'Prepo',d:'Prepositions',l:'A1',o:5},
    {t:'An der Stad 2',d:'More city vocabulary',l:'A1',o:6},
    {t:'Mai Program',d:'Daily routine and schedule',l:'A1',o:7},
    {t:'Haus',d:'House and home vocabulary',l:'A1',o:8},
    {t:'Review',d:'Revision of chapters 1-9',l:'A1',o:9},
    {t:'Perfect hunn',d:'Past tense with hunn',l:'A2',o:0},
    {t:'Perfect sinn',d:'Past tense with sinn',l:'A2',o:1},
    {t:'Vakanz',d:'Vacation and travel',l:'A2',o:2},
    {t:'Imperfect',d:'Imperfect tense',l:'A2',o:3},
    {t:'Kleeder',d:'Clothing vocabulary',l:'A2',o:4},
    {t:'Comparison',d:'Comparing things',l:'A2',o:5},
    {t:'Well',d:'Giving reasons',l:'A2',o:6},
    {t:'Wellen',d:'Modal verbs',l:'A2',o:7},
    {t:'Reflexive 1',d:'Reflexive verbs intro',l:'A2',o:8},
    {t:'Reflexive 2',d:'Advanced reflexive verbs',l:'A2',o:9},
  ];
  for (const c of chData) {
    await prisma.chapter.upsert({
      where: { level_learningPath_orderIndex: { level: c.l, learningPath: 'daily_life', orderIndex: c.o } },
      update: {},
      create: { title: c.t, description: c.d, level: c.l, learningPath: 'daily_life', orderIndex: c.o, published: true },
    });
  }
  console.log('Seeded 20 chapters.');
}

async function main() {
  await prisma.language.upsert({ where: { code: 'lb' }, update: {}, create: { code: 'lb', name: 'Luxembourgish', isDefault: true } });
  await seedChapters();
  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
