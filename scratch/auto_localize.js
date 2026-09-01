const fs = require('fs');
const path = require('path');

const arPath = 'src/locales/ar.json';
const enPath = 'src/locales/en.json';

let ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

let autoCounter = 1;

function getNextKey() {
  while (ar[`ui.auto_${autoCounter}`]) {
    autoCounter++;
  }
  return `ui.auto_${autoCounter}`;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Need to make sure `useLanguage` is imported and `const { t } = useLanguage();` exists if we add translations
  // We'll skip that for now and just replace, and if a file crashes we fix it manually. Or we can just try to inject it.
  
  // 1. Replace strings in single/double quotes (Attributes, Variables)
  // We look for '= "عربي"' or '= 'عربي'' or ': "عربي"' or 'return "عربي"' etc
  content = content.replace(/(?<=[:=,>(\s])(['"])([^'"]*[\u0600-\u06FF]+[^'"]*)\1/g, (match, quote, arabicText) => {
    // Check if it's already a t() call (e.g. t("عربي") - shouldn't happen but just in case)
    if (arabicText.includes('t(')) return match;
    
    // Find existing key if exists
    let key = Object.keys(ar).find(k => ar[k] === arabicText);
    if (!key) {
      key = getNextKey();
      ar[key] = arabicText;
      en[key] = arabicText; // We just put arabic in EN for now, user can translate later or we can call a free API
    }
    
    // Replace with t('key') || 'arabic'
    return `(t('${key}') || '${arabicText}')`;
  });

  // 2. Replace JSX text nodes
  // >عربي<
  content = content.replace(/>([^<]*[\u0600-\u06FF]+[^<]*)</g, (match, arabicText) => {
    let trimmed = arabicText.trim();
    if (!trimmed) return match;
    if (trimmed.includes('t(')) return match; // Already has t()
    
    let key = Object.keys(ar).find(k => ar[k] === trimmed);
    if (!key) {
      key = getNextKey();
      ar[key] = trimmed;
      en[key] = trimmed;
    }
    
    // Replace inside the tags
    return `>{t('${key}') || '${trimmed}'}<`;
  });

  if (content !== originalContent) {
    // Inject import and hook if missing
    if (!content.includes('useLanguage')) {
      content = `import { useLanguage } from '../../../src/engine/ui-loader/LanguageContext';\n` + content;
      // We assume there's a React component to inject into. This is tricky.
      // Better to just let Vite fail and we fix it manually since it's a few files, OR we can be smart.
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      walk(file);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(file);
    }
  });
}

walk('./src/pages');
walk('./src/components');

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Localization complete. Check for missing useLanguage hooks!');
