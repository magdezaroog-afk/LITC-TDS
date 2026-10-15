const fs = require('fs');
const file = 'src/backend/controllers/OrganizationController.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find the line index with `// Soft-delete any SQL departments that were removed from the saved snapshot`
const commentIdx = lines.findIndex(l => l.includes('Soft-delete any SQL departments that were removed from the saved snapshot'));
console.log('commentIdx:', commentIdx);

if (commentIdx !== -1) {
  // Line commentIdx + 1 is `      if (savedDeptIds.length > 0) {`
  // We want to replace from commentIdx to where the closing bracket of `if (savedDeptIds.length > 0)` is.
  // Let's find the closing bracket before `// Soft-delete any SQL teams`
  const teamCommentIdx = lines.findIndex(l => l.includes('Soft-delete any SQL teams that were removed from the saved departments'));
  console.log('teamCommentIdx:', teamCommentIdx);

  const newBlock = [
    '      // Soft-delete any SQL departments that are not in the saved snapshot',
    '      const orphanedDepts = await prisma.department.findMany({',
    '        where: {',
    '          ...(savedDeptIds.length > 0 ? { id: { notIn: savedDeptIds } } : {}),',
    '          isDeleted: false',
    '        },',
    '        select: { id: true }',
    '      });',
    '',
    '      for (const orphan of orphanedDepts) {',
    '        await prisma.department.update({',
    '          where: { id: orphan.id },',
    '          data: { isDeleted: true }',
    '        });',
    '        // Unassign users from this orphaned department',
    '        await prisma.user.updateMany({',
    '          where: { departmentId: orphan.id },',
    '          data: { departmentId: null }',
    '        });',
    '        // Soft-delete teams under this orphaned department',
    '        await prisma.team.updateMany({',
    '          where: { departmentId: orphan.id },',
    '          data: { isDeleted: true }',
    '        });',
    '      }',
    ''
  ];

  lines.splice(commentIdx, teamCommentIdx - commentIdx, ...newBlock);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Patched OrganizationController.ts successfully!');
} else {
  console.error('Comment not found!');
}
