const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tickets = await prisma.ticket.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    include: {
      state: true,
      creator: { select: { id: true, fullName: true } },
      assignments: {
        include: { assignedTech: { select: { id: true, fullName: true } } }
      }
    }
  });

  console.log('Recent Tickets:');
  for (const t of tickets) {
    console.log(`- ID: ${t.id}, Title: ${t.title}, State: ${t.state?.name} (${t.state?.label}), Flow: ${t.flowDefinitionId || t.routeId}, Creator: ${t.creator?.fullName} (#${t.creatorId}), ResolutionNotes: ${t.resolutionNotes}`);
    console.log(`  Assignments:`, t.assignments.map(a => `Tech: ${a.assignedTech?.fullName} (#${a.assignedTechId}), Active: ${a.isCurrentActive}`));
  }

  const states = await prisma.ticketState.findMany();
  console.log('All Ticket States in DB:', states);
}

check().catch(console.error).finally(() => prisma.$disconnect());
