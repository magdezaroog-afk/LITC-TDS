const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectTicketsRequesterData() {
  const tickets = await prisma.ticket.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      title: true,
      departmentId: true,
      creatorId: true,
      creator: { select: { id: true, fullName: true, department: true } },
      formData: true,
      routingMetadata: true
    }
  });

  console.log(`Total active tickets: ${tickets.length}`);
  tickets.forEach(t => {
    let metaDept = null;
    let metaDiv = null;
    let metaBldg = null;
    if (t.routingMetadata) {
      try {
        const meta = JSON.parse(t.routingMetadata);
        metaDept = meta.dynamicFields?.department || meta.department;
        metaDiv = meta.dynamicFields?.division || meta.division;
        metaBldg = meta.dynamicFields?.building || meta.building;
      } catch {}
    }
    const formDept = t.formData.find(f => f.fieldKey === 'department')?.fieldValue;
    const formBldg = t.formData.find(f => f.fieldKey === 'building')?.fieldValue;
    const creatorDept = t.creator?.department;
    console.log(`Ticket #${t.id}: formDept="${formDept}", metaDept="${metaDept}", creatorDept="${creatorDept}", formBldg="${formBldg}", metaBldg="${metaBldg}"`);
  });
}

inspectTicketsRequesterData().catch(console.error).finally(() => prisma.$disconnect());
