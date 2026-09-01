const fs = require('fs');

// Fix 1: UILayoutEngineTab.tsx:328
{
  const fp = 'src/pages/admin/tabs/UILayoutEngineTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Remove erroneous injection of const { t } = useLanguage();
  // It seems it was injected inside a type or interface or object again.
  // The error is at line 328: `const { t } = useLanguage();`
  // We'll just remove it if it's the only thing on the line, and wait for the compiler to tell us if we broke anything.
  // Actually, let's remove it if it follows an object literal `{` or similar.
  c = c.replace(
    /\{\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n/g,
    '{\n'
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed UILayoutEngineTab.tsx');
}

// Fix 2: TicketRoutingTab.tsx:625
{
  const fp = 'src/pages/admin/tabs/TicketRoutingTab.tsx';
  let c = fs.readFileSync(fp, 'utf8');
  // Fix: {editingFieldId ? 'حفظ ال {t('ui.edit')} ات' : 'حفظ المستدلة'}
  c = c.replace(
    `{editingFieldId ? 'حفظ ال {t('ui.edit')} ات' : 'حفظ المستدلة'}`,
    `{editingFieldId ? 'حفظ التعديلات' : 'حفظ المستدلة'}`
  );
  fs.writeFileSync(fp, c);
  console.log('Fixed TicketRoutingTab.tsx');
}

console.log('All targeted fixes applied!');
