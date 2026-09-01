const fs = require('fs');
const path = require('path');
const dir = 'src/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('console.log') || content.includes('console.warn') || content.includes('console.error')) {
    content = content.replace(/console\.log/g, 'Logger.info')
                     .replace(/console\.warn/g, 'Logger.warn')
                     .replace(/console\.error/g, 'Logger.error');
    if (!content.includes('import { Logger }')) {
      content = "import { Logger } from '../backend/infrastructure/Logger';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
});
