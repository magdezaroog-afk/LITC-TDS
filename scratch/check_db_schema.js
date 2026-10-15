const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  try {
    const flows = await prisma.flowDefinition.findMany({
      include: { formSchema: true, department: true }
    });
    console.log('--- FLOWS & SCHEMAS ---');
    console.log(JSON.stringify(flows, null, 2));

    const formCount = await prisma.ticketFormData.count();
    console.log('TicketFormData count:', formCount);

    const sampleData = await prisma.ticketFormData.findMany({ take: 10 });
    console.log('Sample Data:', sampleData);

    const depts = await prisma.department.findMany();
    console.log('Departments:', depts.map(d => ({ id: d.id, name: d.name })));

    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, username: true, fullName: true, departmentId: true, role: { select: { name: true } } }
    });
    console.log('Sample Users:', users);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
