const request = require('supertest');
const app = require('../src/index');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /sum', () => {
  it('returns the sum of two numbers', async () => {
    const res = await request(app).get('/sum?a=7&b=5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ a: 7, b: 5, sum: 12 });
  });

  it('returns 400 for invalid numbers', async () => {
    const res = await request(app).get('/sum?a=foo&b=5');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/must be valid numbers/i);
  });
});
