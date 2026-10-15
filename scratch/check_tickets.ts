import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTickets() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      departmentObj: true,
      creator: true
    }
  });
  
  console.log('--- LATEST 5 TICKETS ---');
  for (const t of tickets) {
    console.log(`Ticket ID: ${t.id} - ${t.title}`);
    console.log(`  Sender: ${t.creator?.fullName}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Routed to Department ID: ${t.department} (Name: ${t.departmentObj?.name || 'N/A'})`);
    console.log(`  Route Data: ${JSON.stringify(t.routeData)}`);
    console.log('---------------------------');
  }

  // Check Majdi's department
  const majdi = await prisma.user.findUnique({
    where: { email: 'majdi.alzarrouk@litc.ly' },
    include: { department: true }
  });

  console.log(`Majdi's Department ID: ${majdi?.departmentId} (Name: ${majdi?.department?.name})`);
}

checkTickets().finally(() => prisma.$disconnect());
