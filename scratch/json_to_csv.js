const fs = require('fs');

const jsonPath = 'scratch/extracted_arabic.json';
const csvPath = 'ترجمات_النظام.csv';

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// CSV Header with BOM for Excel to recognize Arabic (UTF-8)
let csvContent = '\uFEFFKey,Arabic,English\n';

for (const [key, val] of Object.entries(data)) {
  // Escape quotes
  const ar = val.arabic.replace(/"/g, '""');
  const en = val.english.replace(/"/g, '""');
  csvContent += `"${key}","${ar}","${en}"\n`;
}

fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log('CSV file created: ' + csvPath);
