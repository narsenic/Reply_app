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

  console.log("Seed complete: language + A1 curriculum created.");
}

async function seedGrammarLessons(curriculumId: string) {
  const lessons = [
    {
      title: "Basic Greetings & Introductions",
      order: 0,
      content: [
        { type: "text", body: "<h3>Moien! — Hello!</h3><p>In Luxembourgish, we greet people with <strong>Moien</strong> (Hello) and say goodbye with <strong>Äddi</strong>.</p><p>Other useful phrases:</p><ul><li><strong>Wéi geet et?</strong> — How are you?</li><li><strong>Gutt, merci!</strong> — Good, thanks!</li><li><strong>Ech heeschen...</strong> — My name is...</li></ul>", orderIndex: 0 },
      ],
      exercises: [
        { type: "multiple-choice", prompt: 'How do you say "Hello" in Luxembourgish?', options: ["Moien", "Äddi", "Merci", "Pardon"], correctAnswer: "Moien", explanation: '"Moien" is the standard greeting in Luxembourgish.', orderIndex: 0 },
        { type: "multiple-choice", prompt: 'What does "Äddi" mean?', options: ["Hello", "Goodbye", "Thank you", "Please"], correctAnswer: "Goodbye", explanation: '"Äddi" means goodbye in Luxembourgish.', orderIndex: 1 },
        { type: "fill-blank", prompt: 'Complete: "Wéi geet ___?" (How are you?)', options: null, correctAnswer: "et", explanation: '"Wéi geet et?" means "How are you?" — "et" means "it".', orderIndex: 2 },
      ],
    },
    {
      title: "Articles & Gender",
      order: 1,
      content: [
        { type: "text", body: "<h3>Luxembourgish Articles</h3><p>Luxembourgish has three genders: masculine, feminine, and neuter.</p><ul><li><strong>Den</strong> — the (masculine): den Hond (the dog)</li><li><strong>D'</strong> — the (feminine): d'Kaz (the cat)</li><li><strong>Dat</strong> — the (neuter): dat Kand (the child)</li></ul><p>Unlike English, every noun has a gender you need to learn!</p>", orderIndex: 0 },
      ],
      exercises: [
        { type: "multiple-choice", prompt: 'Which article is used for masculine nouns?', options: ["Den", "D'", "Dat", "Dem"], correctAnswer: "Den", explanation: '"Den" is the definite article for masculine nouns.', orderIndex: 0 },
        { type: "multiple-choice", prompt: '"Dat Buch" — What gender is "Buch" (book)?', options: ["Masculine", "Feminine", "Neuter"], correctAnswer: "Neuter", explanation: '"Dat" indicates neuter gender. "Dat Buch" = the book.', orderIndex: 1 },
        { type: "multiple-choice", prompt: 'How do you say "the cat" in Luxembourgish?', options: ["den Kaz", "d'Kaz", "dat Kaz", "dem Kaz"], correctAnswer: "d'Kaz", explanation: '"Kaz" (cat) is feminine, so it uses "d\'" as the article.', orderIndex: 2 },
      ],
    },
    {
      title: "Basic Verb Conjugation",
      order: 2,
      content: [
        { type: "text", body: "<h3>Present Tense Verbs</h3><p>The verb <strong>sinn</strong> (to be) is one of the most important:</p><ul><li><strong>Ech sinn</strong> — I am</li><li><strong>Du bass</strong> — You are</li><li><strong>Hien/Hatt ass</strong> — He/She is</li><li><strong>Mir sinn</strong> — We are</li></ul><p>The verb <strong>schwätzen</strong> (to speak):</p><ul><li><strong>Ech schwätzen</strong> — I speak</li><li><strong>Du schwätz</strong> — You speak</li></ul>", orderIndex: 0 },
      ],
      exercises: [
        { type: "multiple-choice", prompt: 'How do you say "I am" in Luxembourgish?', options: ["Ech sinn", "Du bass", "Hien ass", "Mir sinn"], correctAnswer: "Ech sinn", explanation: '"Ech" = I, "sinn" = am. "Ech sinn" = I am.', orderIndex: 0 },
        { type: "fill-blank", prompt: 'Complete: "Ech ___ Lëtzebuergesch." (I speak Luxembourgish)', options: null, correctAnswer: "schwätzen", explanation: '"Schwätzen" means "to speak". With "Ech" (I), it stays "schwätzen".', orderIndex: 1 },
        { type: "multiple-choice", prompt: 'What is the correct form: "Du ___ Student."', options: ["sinn", "bass", "ass", "si"], correctAnswer: "bass", explanation: 'With "Du" (you), the verb "sinn" becomes "bass".', orderIndex: 2 },
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
      curriculumId, title: "At the Café", orderIndex: 0,
      content: { create: [
        { type: "text", body: "<h3>Am Café</h3><p><strong>Anna:</strong> Moien! Ech hätt gär ee Kaffi, wann ech gelift.</p><p><strong>Kellner:</strong> Moien! Mat Mëllech oder ouni?</p><p><strong>Anna:</strong> Mat Mëllech, merci.</p><p><strong>Kellner:</strong> Hei ass Äre Kaffi. Dat mécht 3 Euro.</p><p><strong>Anna:</strong> Merci villmools! Äddi!</p><hr/><p><em>Vocabulary: Kaffi = coffee, Mëllech = milk, ouni = without, merci villmools = thank you very much</em></p>", orderIndex: 0 },
      ]},
      exercises: { create: [
        { type: "multiple-choice", prompt: "What does Anna order?", options: ["Tea", "Coffee", "Water", "Juice"], correctAnswer: "Coffee", explanation: '"Kaffi" means coffee. Anna says "Ech hätt gär ee Kaffi" (I would like a coffee).', orderIndex: 0 },
        { type: "multiple-choice", prompt: "How does Anna want her coffee?", options: ["Black", "With milk", "With sugar", "Iced"], correctAnswer: "With milk", explanation: 'Anna says "Mat Mëllech" which means "with milk".', orderIndex: 1 },
        { type: "multiple-choice", prompt: 'What does "merci villmools" mean?', options: ["Goodbye", "Please", "Thank you very much", "You\'re welcome"], correctAnswer: "Thank you very much", explanation: '"Merci villmools" = thank you very much (merci = thanks, villmools = many times).', orderIndex: 2 },
      ]},
    },
  });
}

async function seedListeningLessons(curriculumId: string) {
  await prisma.lesson.create({
    data: {
      curriculumId, title: "Everyday Phrases", orderIndex: 0,
      content: { create: [
        { type: "text", body: "Moien! Wéi geet et? Ech heeschen Anna. Ech sinn aus Lëtzebuerg. Ech schwätzen Lëtzebuergesch an Franséisch. Ech schaffen zu Lëtzebuerg-Stad. Et geet mir gutt, merci!", orderIndex: 0 },
      ]},
      exercises: { create: [
        { type: "multiple-choice", prompt: "What is the speaker's name?", options: ["Marie", "Anna", "Sophie", "Lisa"], correctAnswer: "Anna", explanation: 'The speaker says "Ech heeschen Anna" (My name is Anna).', orderIndex: 0 },
        { type: "multiple-choice", prompt: "Where is the speaker from?", options: ["France", "Germany", "Luxembourg", "Belgium"], correctAnswer: "Luxembourg", explanation: '"Ech sinn aus Lëtzebuerg" = I am from Luxembourg.', orderIndex: 1 },
        { type: "multiple-choice", prompt: "What languages does the speaker speak?", options: ["Luxembourgish and German", "Luxembourgish and French", "French and German", "Only Luxembourgish"], correctAnswer: "Luxembourgish and French", explanation: '"Ech schwätzen Lëtzebuergesch an Franséisch" = I speak Luxembourgish and French.', orderIndex: 2 },
      ]},
    },
  });
}

async function seedSpeakingLessons(curriculumId: string) {
  await prisma.lesson.create({
    data: {
      curriculumId, title: "Introduce Yourself", orderIndex: 0,
      content: { create: [
        { type: "text", body: "<h3>Practice introducing yourself</h3><p>Try saying these phrases out loud:</p><ul><li>Moien! (Hello!)</li><li>Ech heeschen... (My name is...)</li><li>Ech sinn aus... (I am from...)</li><li>Ech schwätzen... (I speak...)</li></ul>", orderIndex: 0 },
      ]},
      exercises: { create: [
        { type: "multiple-choice", prompt: 'How do you say "My name is..." in Luxembourgish?', options: ["Ech heeschen...", "Ech sinn...", "Ech schwätzen...", "Ech wunnen..."], correctAnswer: "Ech heeschen...", explanation: '"Heeschen" means "to be called". "Ech heeschen" = My name is / I am called.', orderIndex: 0 },
        { type: "multiple-choice", prompt: 'How do you say "I speak Luxembourgish"?', options: ["Ech schwätzen Lëtzebuergesch", "Ech heeschen Lëtzebuergesch", "Ech sinn Lëtzebuergesch", "Ech wunnen Lëtzebuergesch"], correctAnswer: "Ech schwätzen Lëtzebuergesch", explanation: '"Schwätzen" = to speak. "Ech schwätzen Lëtzebuergesch" = I speak Luxembourgish.', orderIndex: 1 },
      ]},
    },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
