import request from 'supertest';
import app, { prisma } from '../index.js';
import { jest } from '@jest/globals';

beforeAll(() => {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await prisma.$disconnect();
});

test('GET /products returns data structure', async () => {
  jest.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([]);
  jest.spyOn(prisma.product, 'count').mockResolvedValueOnce(0);

  const res = await request(app).get('/products');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('pagination');
});
