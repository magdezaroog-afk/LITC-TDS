const fs = require('fs');

const jsonPath = 'scratch/extracted_arabic.json';
const txtPath = 'ترجمات_النظام.txt';

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let txtContent = '==========================================\n';
txtContent += ' ملف مراجعة الترجمات (افتحه في مفكرة Notepad)\n';
txtContent += '==========================================\n';
txtContent += 'طريقة العمل: فقط اكتب الترجمة الإنجليزية المطلوبة بعد علامة التساوي (=).\n\n';

for (const [key, val] of Object.entries(data)) {
  // Remove newlines from strings to keep it one line
  const ar = val.arabic.replace(/\n/g, ' ').replace(/\r/g, '');
  txtContent += `${key} | ${ar} = \n`;
}

fs.writeFileSync(txtPath, txtContent, 'utf8');
console.log('TXT file created: ' + txtPath);
