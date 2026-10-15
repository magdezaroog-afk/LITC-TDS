import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

// NOTE: ticketLocation model doesn't exist in schema.
// Locations are stored as JSON in SystemSetting with key 'litc_locations'.

const LOCATIONS_KEY = 'litc_locations';

async function getLocations(): Promise<any[]> {
  const s = await prisma.systemSetting.findUnique({ where: { settingKey: LOCATIONS_KEY } });
  return s?.settingValue ? JSON.parse(s.settingValue) : [];
}

async function saveLocations(locations: any[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { settingKey: LOCATIONS_KEY },
    create: { settingKey: LOCATIONS_KEY, settingValue: JSON.stringify(locations), description: 'Ticket Locations' },
    update: { settingValue: JSON.stringify(locations) }
  });
}

export class LocationController {

  static async getAllLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = (await getLocations()).filter((l: any) => !l.isDeleted);
      res.json(locations);
    } catch (err) { next(err); }
  }

  static async createLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, building, department, office } = req.body;
      const locations = await getLocations();
      const newLoc = { id: Date.now(), name, building, department, office, isDeleted: false };
      locations.push(newLoc);
      await saveLocations(locations);
      res.status(201).json(newLoc);
    } catch (err) { next(err); }
  }

  static async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, building, department, office, isDeleted } = req.body;
      const locations = await getLocations();
      const idx = locations.findIndex((l: any) => l.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Location not found' });
      locations[idx] = { ...locations[idx], name, building, department, office, isDeleted };
      await saveLocations(locations);
      res.json(locations[idx]);
    } catch (err) { next(err); }
  }

  static async deleteLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const locations = await getLocations();
      const idx = locations.findIndex((l: any) => l.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Location not found' });
      locations[idx] = { ...locations[idx], isDeleted: true };
      await saveLocations(locations);
      res.json(locations[idx]);
    } catch (err) { next(err); }
  }
}
