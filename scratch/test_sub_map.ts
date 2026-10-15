import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ticket = await prisma.ticket.findFirst({
    where: { id: 35 },
    include: {
      subTickets: {
        include: { state: true, departmentObj: true }
      },
      departmentObj: true,
      state: true
    }
  });

  console.log('Ticket 35:', ticket ? {
    id: ticket.id,
    state: ticket.state.name,
    dept: ticket.departmentObj?.name,
    subTicketsCount: ticket.subTickets.length
  } : 'Not found');

  if (ticket && ticket.subTickets.length === 0) {
    const inProgressState = await prisma.ticketState.findFirst({
      where: { name: 'IN_PROGRESS' }
    }) || ticket.state;

    const otherDept = await prisma.department.findFirst({
      where: { id: { not: ticket.departmentId || 0 } }
    });

    const sub = await prisma.ticket.create({
      data: {
        title: 'فحص إعدادات السويتش والربط الشبكي',
        description: 'مهمة فنية مساندة للتحقق من منافذ الشبكة',
        priority: 'MEDIUM',
        ticketType: 'SUB_TICKET',
        parentId: ticket.id,
        stateId: inProgressState.id,
        departmentId: otherDept?.id || ticket.departmentId,
        categoryId: ticket.categoryId,
        creatorId: ticket.creatorId,
      }
    });

    console.log('Created sub-ticket:', sub.id);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
