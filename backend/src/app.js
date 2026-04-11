const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const { version: backendVersion } = require('../package.json')
require('dotenv').config()

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`)
})

const app = express()
app.use(cors())
app.use(express.json())

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/
const PROD_ALIASES = new Set(['prod', 'production', 'main'])

function normalizeAppEnv(value) {
  const raw = String(value || '').trim().toLowerCase()
  return PROD_ALIASES.has(raw) ? 'production' : 'development'
}

const backendAppEnv = normalizeAppEnv(process.env.APP_ENV || process.env.NODE_ENV || 'development')

const ENGINEERING_CODE = process.env.ENGINEERING_CODE || '1092'
const engineeringItems = new Map()

function verifyEngineeringCode(req, res, next) {
  const code = req.headers['x-engineering-code']
  if (code !== ENGINEERING_CODE) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

function ensureClientEnvMatches(req, res, next) {
  const headerValue = req.headers['x-app-env']
  if (!headerValue) {
    return next()
  }

  const clientAppEnv = normalizeAppEnv(headerValue)
  if (clientAppEnv !== backendAppEnv) {
    return res.status(409).json({
      error: `Environment mismatch: client=${clientAppEnv}, backend=${backendAppEnv}`,
    })
  }

  return next()
}

app.get('/health', (req, res) => res.json({
  status: 'ok',
  env: process.env.APP_ENV || process.env.NODE_ENV || 'development',
}))

app.get('/engineering/checks', (req, res) => {
  return res.json({
    status: 'ok',
    backendVersion,
    environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
    commitSha: process.env.RENDER_GIT_COMMIT || process.env.COMMIT_SHA || process.env.GIT_SHA || null,
    branch: process.env.RENDER_GIT_BRANCH || process.env.GIT_BRANCH || null,
    engineeringModeEnabled: true,
    timestamp: new Date().toISOString(),
  })
})

app.post('/engineering/test-item', verifyEngineeringCode, (req, res) => {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const item = {
    id,
    value: req.body?.value ?? 'engineering-smoke-test',
    createdAt: new Date().toISOString(),
  }
  engineeringItems.set(id, item)
  return res.status(201).json(item)
})

app.get('/engineering/test-item/:id', verifyEngineeringCode, (req, res) => {
  const item = engineeringItems.get(req.params.id)
  if (!item) {
    return res.status(404).json({ error: 'Not found' })
  }
  return res.json(item)
})

app.delete('/engineering/test-item/:id', verifyEngineeringCode, (req, res) => {
  const existed = engineeringItems.delete(req.params.id)
  if (!existed) {
    return res.status(404).json({ error: 'Not found' })
  }
  return res.status(204).send()
})

app.get('/auth/username-available', ensureClientEnvMatches, async (req, res, next) => {
  try {
    const username = String(req.query.username || '').trim().toLowerCase()

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-24 characters and use lowercase letters, numbers, or underscores.',
      })
    }

    const perPage = 200
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

      if (error) {
        const wrappedError = new Error(error.message || 'Failed to query users')
        wrappedError.status = 502
        throw wrappedError
      }

      const users = data?.users || []
      const match = users.find(user =>
        String(user.user_metadata?.username || '').trim().toLowerCase() === username
      )

      if (match) return res.json({ available: false })

      hasMore = users.length === perPage
      page += 1
    }

    return res.json({ available: true })
  } catch (error) {
    return next(error)
  }
})

app.get('/auth/email-available', ensureClientEnvMatches, async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' })
    }

    const perPage = 200
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

      if (error) {
        const wrappedError = new Error(error.message || 'Failed to query users')
        wrappedError.status = 502
        throw wrappedError
      }

      const users = data?.users || []
      const match = users.find(user => user.email?.toLowerCase() === email)

      if (match) return res.json({ available: false })

      hasMore = users.length === perPage
      page += 1
    }

    return res.json({ available: true })
  } catch (error) {
    return next(error)
  }
})

app.use((err, req, res, next) => {
  void next
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

module.exports = { app, supabaseAdmin }