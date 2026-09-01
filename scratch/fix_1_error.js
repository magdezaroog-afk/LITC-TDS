const fs = require('fs');

const fp = 'src/pages/admin/tabs/UILayoutEngineTab.tsx';
let c = fs.readFileSync(fp, 'utf8');
// Fix: { id: 'BY_TARGET_TICKET', label: 'فرز ب {t('ui.ticket_number')}  أو المهمة التشغيلية' }
c = c.replace(
  `{ id: 'BY_TARGET_TICKET', label: 'فرز ب {t('ui.ticket_number')}  أو المهمة التشغيلية' },`,
  `{ id: 'BY_TARGET_TICKET', label: 'فرز برقم التذكرة أو المهمة التشغيلية' },`
);
fs.writeFileSync(fp, c);
console.log('Fixed UILayoutEngineTab.tsx');
