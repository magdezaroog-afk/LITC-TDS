const fs = require("fs");
const path = require("path");

function findFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const skip = ["node_modules", ".git", "dist", "backups", "scratch"];
      if (entry.isDirectory() && !skip.includes(entry.name)) {
        results.push(...findFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        results.push(fullPath);
      }
    }
  } catch(e) {}
  return results;
}

const SRC = path.resolve("src");
const files = findFiles(SRC);
let totalFixed = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Fix double-wrapped pattern: (t('key') || (t('key') || 'fallback')) -> t('key', 'fallback')
  // Pattern 1: single quotes
  content = content.replace(/\(t\('([^']+)'\) \|\| \(t\('[^']+'\) \|\| '([^']*)'\)\)/g, "t('$1', '$2')");
  // Pattern 2: no fallback double wrap
  content = content.replace(/\(t\('([^']+)'\) \|\| \(t\('[^']+'\)\)\)/g, "t('$1')");

  // Fix single-wrapped: (t('key') || 'fallback') -> t('key', 'fallback')
  content = content.replace(/\(t\('([^']+)'\) \|\| '([^']+)'\)/g, "t('$1', '$2')");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Fixed: " + path.relative(SRC, filePath));
    totalFixed++;
  }
}

console.log("\nTotal: " + totalFixed + " files have t() calls simplified");
