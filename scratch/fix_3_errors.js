const fs = require('fs');

// Fix 1: UILayoutEngineTab.tsx:328
{
  const fp = 'src/pages/admin/tabs/UILayoutEngineTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Remove erroneous injection of const { t } = useLanguage();
  c = c.replace(
    /const MockDashboardConfig: ComponentConfig = \{\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n/,
    'const MockDashboardConfig: ComponentConfig = {\n'
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed UILayoutEngineTab.tsx');
}

// Fix 2: TicketRoutingTab.tsx:444
{
  const fp = 'src/pages/admin/tabs/TicketRoutingTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Fix: if (editingFieldId) return ' {t('ui.edit')}  المستدلة';
  c = c.replace(
    `if (editingFieldId) return ' {t('ui.edit')}  المستدلة';`,
    `if (editingFieldId) return t('ui.edit') + ' المستدلة';`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed TicketRoutingTab.tsx');
}

// Fix 3: InstitutionalStructureTab.tsx:439
{
  const fp = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Fix: alert('تم  {t('ui.save')}  الهيكل التنظيمي بنجاح!');
  c = c.replace(
    `alert('تم  {t('ui.save')}  الهيكل التنظيمي بنجاح!');`,
    `alert('تم حفظ الهيكل التنظيمي بنجاح!');`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed InstitutionalStructureTab.tsx');
}

console.log('All targeted fixes applied!');
