process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-key'

const request = require('supertest')
const { app } = require('../src/app')

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health')
  expect(res.statusCode).toBe(200)
  expect(res.body.status).toBe('ok')
})