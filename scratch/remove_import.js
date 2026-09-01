const fs = require('fs');
const fp = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(/import \{ useLanguage \} from '..\/..\/..\/engine\/ui-loader\/LanguageContext';\r?\n/, '');

fs.writeFileSync(fp, c);
