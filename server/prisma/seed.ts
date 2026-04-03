import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.language.upsert({
    where: { code: "lb" },
    update: {},
    create: {
      code: "lb",
      name: "Luxembourgish",
      isDefault: true,
    },
  });

  console.log("Seed complete: default language 'Luxembourgish' (lb) created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
