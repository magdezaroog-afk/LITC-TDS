import request from 'supertest';
import app from '../src/app'; // assuming app is exported from app.ts

describe('SystemAdminController API Tests', () => {
  it('should return 401 Unauthorized for /api/v1/admin/ui-layouts without token', async () => {
    const res = await request(app).get('/api/v1/admin/ui-layouts');
    expect(res.statusCode).toEqual(401);
  });
  
  // Future tests with mocked Prisma DB would go here
});
