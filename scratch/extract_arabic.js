const fs = require('fs');
const path = require('path');

const extracted = new Set();

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      walk(file);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      extractFromFile(file);
    }
  });
}

function extractFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Strings in single/double quotes or backticks containing Arabic
  const quoteRegex = /(['"`])([^'"`]*[\u0600-\u06FF]+[^'"`]*)\1/g;
  let match;
  while ((match = quoteRegex.exec(content)) !== null) {
    const text = match[2].trim();
    if (text && !text.includes('t(')) { // avoid matching strings that are already translations (though this might false-positive if they literally contain "t(")
      extracted.add(text);
    }
  }

  // 2. JSX text nodes containing Arabic
  const jsxRegex = />([^<]*[\u0600-\u06FF]+[^<]*)</g;
  while ((match = jsxRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && !text.includes('t(')) {
      extracted.add(text);
    }
  }
}

// Ensure locales exist so we don't extract what's already translated
const arLocale = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));
const existingArabicValues = Object.values(arLocale).map(v => typeof v === 'string' ? v.trim() : '');

walk('./src/pages');
walk('./src/components');
walk('./src/engine');

const uniqueStrings = Array.from(extracted).filter(s => {
  // Filter out those already present in ar.json exactly
  if (existingArabicValues.includes(s)) return false;
  // Filter out noise
  if (s.length < 2) return false;
  return true;
});

// Prepare the output object with proposed English translations (basic ones just to have structure)
const reviewObject = {};
uniqueStrings.forEach((arStr, index) => {
  const key = `sys.auto_${index + 1}`; // e.g. sys.auto_1
  reviewObject[key] = {
    arabic: arStr,
    english: '--- [PROPOSE TRANSLATION] ---'
  };
});

fs.writeFileSync('scratch/extracted_arabic.json', JSON.stringify(reviewObject, null, 2));
console.log(`Extracted ${uniqueStrings.length} unique strings.`);
