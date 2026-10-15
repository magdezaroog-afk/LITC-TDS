const { PrismaClient } = require('@prisma/client');
const { OrganizationController } = require('./dist/backend/controllers/OrganizationController.js');

(async () => {
  const req = {
    body: { userId: 1045, departmentId: null, teamId: null, roleId: 26 }
  };
  const res = {
    status: (code) => { console.log('Status:', code); return res; },
    json: (data) => console.log('JSON:', data)
  };

  console.log('Testing assignUser...');
  await OrganizationController.assignUser(req, res);

  console.log('Testing unassignUser...');
  const reqUnassign = {
    params: { userId: '1045' },
    body: { employeeRoleId: 2 }
  };
  await OrganizationController.unassignUser(reqUnassign, res);

})();
