import prisma from "../../lib/prisma";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const HOURS_BETWEEN_LEVELS: Record<string, number> = {
  "A1->A2": 100,
  "A2->B1": 150,
  "B1->B2": 200,
  "B2->C1": 250,
  "C1->C2": 300,
};

const PACE_MINUTES: Record<string, number> = {
  relaxed: 15,
  regular: 30,
  intensive: 60,
  speed: 90,
};

export interface StudyEstimate {
  estimatedWeeks: number;
  dailyMinutes: number;
  totalHours: number;
  recommendedChapters: Array<{
    id: string;
    title: string;
    description: string;
    level: string;
    orderIndex: number;
  }>;
  pace: string;
}

export async function getStudyEstimate(
  currentLevel: string,
  targetLevel: string,
  pace: string,
): Promise<StudyEstimate> {
  const currentIdx = LEVELS.indexOf(currentLevel as (typeof LEVELS)[number]);
  const targetIdx = LEVELS.indexOf(targetLevel as (typeof LEVELS)[number]);

  if (currentIdx === -1 || targetIdx === -1) {
    throw new Error(`Invalid level. Valid levels: ${LEVELS.join(", ")}`);
  }

  if (currentIdx >= targetIdx) {
    throw new Error("Target level must be higher than current level.");
  }

  const dailyMinutes = PACE_MINUTES[pace];
  if (!dailyMinutes) {
    throw new Error(`Invalid pace. Valid options: ${Object.keys(PACE_MINUTES).join(", ")}`);
  }

  // Calculate total hours across all level transitions
  let totalHours = 0;
  for (let i = currentIdx; i < targetIdx; i++) {
    const key = `${LEVELS[i]}->${LEVELS[i + 1]}`;
    totalHours += HOURS_BETWEEN_LEVELS[key] || 0;
  }

  // Calculate weeks needed (7 days per week)
  const totalMinutes = totalHours * 60;
  const estimatedWeeks = Math.ceil(totalMinutes / (dailyMinutes * 7));

  // Fetch recommended chapters for the levels between current and target
  const levelsToStudy: string[] = [];
  for (let i = currentIdx; i < targetIdx; i++) {
    levelsToStudy.push(LEVELS[i]);
  }

  const recommendedChapters = await prisma.chapter.findMany({
    where: {
      level: { in: levelsToStudy },
      published: true,
    },
    orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      orderIndex: true,
    },
  });

  return {
    estimatedWeeks,
    dailyMinutes,
    totalHours,
    recommendedChapters,
    pace,
  };
}