const fs = require('fs');
const fp = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `import { useLanguage } from '../../../../src/engine/ui-loader/LanguageContext';`,
  `import { useLanguage } from '../../../engine/ui-loader/LanguageContext';`
);

// Inject into OrgTreeView
c = c.replace(
  /export const OrgTreeView: React\.FC<any> = \(\{ orgTree, onEdit, onDelete, onAdd \}\) => \{/,
  `export const OrgTreeView: React.FC<any> = ({ orgTree, onEdit, onDelete, onAdd }) => {\n  const { t } = useLanguage();`
);

// Inject into InstitutionalStructureTab
c = c.replace(
  /export const InstitutionalStructureTab: React\.FC<.*> = \(\{ orgTree, setOrgTree \}\) => \{/,
  `export const InstitutionalStructureTab: React.FC<{ orgTree: OrgNode, setOrgTree: React.Dispatch<React.SetStateAction<OrgNode>> }> = ({ orgTree, setOrgTree }) => {\n  const { t } = useLanguage();`
);

fs.writeFileSync(fp, c);
console.log('Fixed InstitutionalStructureTab.tsx');
