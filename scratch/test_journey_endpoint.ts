import { FlowEngineService } from '../src/backend/services/FlowEngineService';

async function main() {
  const service = new FlowEngineService();
  const journey = await service.getTicketJourney(35);
  console.log('Journey steps for ticket 35:');
  console.dir(journey, { depth: null });
}

main().catch(console.error);
