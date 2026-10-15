const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const refs = await prisma.systemReference.findMany({
    where: { type: 'BUILDING' }
  });
  console.log('Buildings:', refs);

  const states = await prisma.ticketState.findMany();
  console.log('Ticket States:', states);

  const tickets = await prisma.ticket.findMany({
    take: 5,
    include: {
      formData: true,
      assignments: { include: { assignedTech: true } }
    }
  });
  console.log('Sample Tickets with FormData & Assignments:', JSON.stringify(tickets, null, 2));

  await prisma.$disconnect();
}
check();
