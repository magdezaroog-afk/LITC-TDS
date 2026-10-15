import { PrismaClient } from '@prisma/client';
import { OrganizationController } from './src/backend/controllers/OrganizationController';

(async () => {
  const req = {
    body: { userId: 1045, departmentId: null, teamId: null, roleId: 26 }
  } as any;
  const res = {
    status: (code: any) => { console.log('Status:', code); return res; },
    json: (data: any) => console.log('JSON:', data)
  } as any;

  console.log('Testing assignUser...');
  await OrganizationController.assignUser(req, res);

  console.log('Testing unassignUser...');
  const reqUnassign = {
    params: { userId: '1045' },
    body: { employeeRoleId: 2 }
  } as any;
  await OrganizationController.unassignUser(reqUnassign, res);
})();
