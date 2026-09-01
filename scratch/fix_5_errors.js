const fs = require('fs');

// Fix 1: TicketRoutingTab.tsx:276 - Arabic mixed with t() in string
// Fix 2: OperationalStructureTab.tsx:756 - same pattern
// Fix 3: InstitutionalStructureTab.tsx:180 - hook in async function signature
// Fix 4: UILayoutEngineTab.tsx:252 - t() call inside object literal string value
// Fix 5: InteractiveTicketCreatorForm.tsx:702 - t() call inside object string

// ─── Fix 1: TicketRoutingTab.tsx ───
{
  const fp = 'src/pages/admin/tabs/TicketRoutingTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Bad: 'هل أنت متأكد من  {t('ui.delete')}  هذا المسار؟'
  // Good: t('ui.confirm_delete_route') or build the string with template
  c = c.replace(
    `'هل أنت متأكد من  {t('ui.delete')}  هذا المسار؟'`,
    `(t('ui.are_you_sure') || 'هل أنت متأكد من حذف هذا المسار؟')`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed TicketRoutingTab.tsx');
}

// ─── Fix 2: OperationalStructureTab.tsx ───
{
  const fp = 'src/pages/admin/tabs/OperationalStructureTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Bad: 'تم  {t('btn.add')}  جميع الأقسام...'
  // Fix by replacing with a clean Arabic string (not using t() in string literals)
  c = c.replace(
    `{ title: 'مكتمل', msg: 'تم  {t('btn.add')}  جميع الأقسام المتاحة لهذه الإدارة.', type: 'success' }`,
    `{ title: t('ui.complete') || 'مكتمل', msg: t('ops.all_divisions_added') || 'تم إضافة جميع الأقسام المتاحة لهذه الإدارة.', type: 'success' }`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed OperationalStructureTab.tsx');
}

// ─── Fix 3: InstitutionalStructureTab.tsx - hook injected in async function signature ───
{
  const fp = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Remove hook from inside async function type signature
  c = c.replace(
    /export const fetchBuildings = async \(\): Promise<\{\s*\n\s*const \{ t \} = useLanguage\(\);\s*\nid: string, name: string\}\[\]> =>/,
    'export const fetchBuildings = async (): Promise<{id: string, name: string}[]> =>'
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed InstitutionalStructureTab.tsx - async function type');
}

// ─── Fix 4: UILayoutEngineTab.tsx - t() inside object string value ───
{
  const fp = 'src/pages/admin/tabs/UILayoutEngineTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Bad: CanClose: 'صلاحية ال {t('btn.close')} '
  // Fix: revert to plain Arabic string
  c = c.replace(
    `CanClose: 'صلاحية ال {t('btn.close')} '`,
    `CanClose: 'صلاحية الإغلاق'`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed UILayoutEngineTab.tsx');
}

// ─── Fix 5: InteractiveTicketCreatorForm.tsx - t() inside object string ───
{
  const fp = 'src/components/organisms/InteractiveTicketCreatorForm.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Bad: label: ' {t('ui.request_title')} '
  // Fix: revert to plain string or use proper JSX expression
  c = c.replace(
    `label: ' {t('ui.request_title')} '`,
    `label: t('ui.request_title') || 'عنوان الطلب'`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed InteractiveTicketCreatorForm.tsx');
}

console.log('All targeted fixes applied!');
