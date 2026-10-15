const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultFormConfig = {
  showBuildingField: false,
  mandatoryBuilding: false,
  showDepartmentField: false,
  mandatoryDepartment: false,
  showDescription: true,
  mandatoryDescription: true,
  showAttachments: true,
  mandatoryAttachments: false,
  attachmentTypes: ['PDF', 'PNG', 'JPG'],
  maxAttachmentMB: 5,
  taxonomy: [],
  customFieldIds: [],
  routeDynamicFields: []
};

async function patchRoutesInDB() {
  const s = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
  if (!s || !s.settingValue) {
    console.log('No routes found in DB.');
    return;
  }
  const routes = JSON.parse(s.settingValue);
  let modified = false;
  const patchedRoutes = routes.map(r => {
    if (!r.formConfig || !Array.isArray(r.formConfig.routeDynamicFields)) {
      modified = true;
      return {
        ...r,
        formConfig: {
          ...defaultFormConfig,
          ...(r.formConfig || {}),
          routeDynamicFields: Array.isArray(r.formConfig?.routeDynamicFields) ? r.formConfig.routeDynamicFields : []
        }
      };
    }
    return r;
  });

  if (modified) {
    await prisma.systemSetting.update({
      where: { settingKey: 'litc_ticket_routes' },
      data: { settingValue: JSON.stringify(patchedRoutes) }
    });
    console.log('✅ Successfully patched existing routes in database with standard formConfig!');
  } else {
    console.log('Routes in DB are already standardized.');
  }
}

patchRoutesInDB().catch(console.error).finally(() => prisma.$disconnect());
