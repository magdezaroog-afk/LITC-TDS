const fs = require('fs');

const fp = 'src/components/organisms/UserTicketTracker.tsx';
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `OPEN: { label: t('ui.in_progress'), icon: '⚙️', color: '#3b82f6' },`,
  `OPEN: { label: 'قيد التنفيذ', icon: '⚙️', color: '#3b82f6' },`
);

fs.writeFileSync(fp, c);
console.log('Fixed UserTicketTracker.tsx safely!');
