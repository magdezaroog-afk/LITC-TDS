const fs = require('fs');
const filePath = 'src/services/TicketStateService.ts';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { redisManager }")) {
  content = content.replace(
    "export class TicketStateService {",
    "import { redisManager } from '../backend/infrastructure/RedisClient';\n\nexport class TicketStateService {"
  );
}

const target = `    // 3. Query allowed transitions from TicketStateTransition
    const transitions = await prisma.ticketStateTransition.findMany({`;

const replacement = `    // 3. Check Redis Cache for Transitions
    const cacheKey = \`transitions:\${ticket.stateId}:\${user.roleId}\`;
    if (redisManager.client) {
      const cached = await redisManager.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // 4. Query allowed transitions from TicketStateTransition
    const transitions = await prisma.ticketStateTransition.findMany({`;

content = content.replace(target, replacement);

const returnTarget = `    });

    return transitions;
  }`;

const returnReplacement = `    });

    if (redisManager.client) {
      await redisManager.client.set(cacheKey, JSON.stringify(transitions), 'EX', 3600);
    }

    return transitions;
  }`;

content = content.replace(returnTarget, returnReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added Redis caching to TicketStateService.ts');
