import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.record.count();
  if (count === 0) {
    await prisma.record.createMany({
      data: [
        {
          title: 'Welcome to Realworld Infrastructure Lab',
          description: 'Initial seed record for the DevOps/SRE laboratory.',
          status: 'active',
        },
        {
          title: 'Database connectivity check',
          description: 'Use this record to verify PostgreSQL reads.',
          status: 'completed',
        },
        {
          title: 'Archived sample',
          description: 'Sample archived record for filter testing.',
          status: 'archived',
        },
      ],
    });
  }

  await prisma.applicationEvent.create({
    data: {
      type: 'APP_SEEDED',
      message: 'Database seed completed',
      metadata: { recordCount: await prisma.record.count() },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
