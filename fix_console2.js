const fs = require('fs');
const files = [ 'src/backend/infrastructure/RedisClient.ts', 'src/backend/infrastructure/BullMQ.ts' ];
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('console.log') || content.includes('console.warn') || content.includes('console.error')) {
    content = content.replace(/console\.log/g, 'Logger.info')
                     .replace(/console\.warn/g, 'Logger.warn')
                     .replace(/console\.error/g, 'Logger.error');
    if (!content.includes('import { Logger }')) {
      content = "import { Logger } from './Logger';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
});
