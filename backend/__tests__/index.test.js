process.env.APP_ENV = 'development'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-key'
delete process.env.SUPABASE_URL_DEV
delete process.env.SUPABASE_SERVICE_KEY_DEV
delete process.env.SUPABASE_URL_STAGING
delete process.env.SUPABASE_SERVICE_KEY_STAGING

const mockListUsers = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
  })),
}))

const request = require('supertest')
const { app } = require('../src/app')

beforeEach(() => {
  mockListUsers.mockReset()
})

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health')
  expect(res.statusCode).toBe(200)
  expect(res.body.status).toBe('ok')
  expect(res.body.env).toBe('development')
})

test('GET /auth/username-available validates username format', async () => {
  const res = await request(app).get('/auth/username-available?username=Not Valid!')

  expect(res.statusCode).toBe(400)
  expect(res.body.error).toContain('Username must be')
  expect(mockListUsers).not.toHaveBeenCalled()
})

test('GET /auth/username-available returns available=true when no match exists', async () => {
  mockListUsers.mockResolvedValue({ data: { users: [] }, error: null })

  const res = await request(app).get('/auth/username-available?username=travel_user')

  expect(res.statusCode).toBe(200)
  expect(res.body.available).toBe(true)
})

test('GET /auth/username-available returns available=false when username exists', async () => {
  mockListUsers.mockResolvedValue({
    data: {
      users: [{ user_metadata: { username: 'travel_user' } }],
    },
    error: null,
  })

  const res = await request(app).get('/auth/username-available?username=travel_user')

  expect(res.statusCode).toBe(200)
  expect(res.body.available).toBe(false)
})

test('GET /auth/username-available blocks mismatched client env header', async () => {
  const res = await request(app)
    .get('/auth/username-available?username=travel_user')
    .set('x-app-env', 'production')

  expect(res.statusCode).toBe(409)
  expect(res.body.error).toContain('Environment mismatch')
})

test('GET /auth/email-available validates email format', async () => {
  const res = await request(app).get('/auth/email-available?email=not-an-email')

  expect(res.statusCode).toBe(400)
  expect(res.body.error).toContain('Email must be')
  expect(mockListUsers).not.toHaveBeenCalled()
})

test('GET /auth/email-available returns canResetPassword=false when account does not exist', async () => {
  mockListUsers.mockResolvedValue({ data: { users: [] }, error: null })

  const res = await request(app).get('/auth/email-available?email=missing@example.com')

  expect(res.statusCode).toBe(200)
  expect(res.body.available).toBe(true)
  expect(res.body.canResetPassword).toBe(false)
})

test('GET /auth/email-available returns canResetPassword=false when email is unconfirmed', async () => {
  mockListUsers.mockResolvedValue({
    data: {
      users: [
        {
          email: 'traveler@example.com',
          email_confirmed_at: null,
        },
      ],
    },
    error: null,
  })

  const res = await request(app).get('/auth/email-available?email=traveler@example.com')

  expect(res.statusCode).toBe(200)
  expect(res.body.available).toBe(false)
  expect(res.body.canResetPassword).toBe(false)
})

test('GET /auth/email-available returns canResetPassword=true when email is confirmed', async () => {
  mockListUsers.mockResolvedValue({
    data: {
      users: [
        {
          email: 'traveler@example.com',
          email_confirmed_at: '2026-04-11T00:00:00.000Z',
        },
      ],
    },
    error: null,
  })

  const res = await request(app).get('/auth/email-available?email=traveler@example.com')

  expect(res.statusCode).toBe(200)
  expect(res.body.available).toBe(false)
  expect(res.body.canResetPassword).toBe(true)
})