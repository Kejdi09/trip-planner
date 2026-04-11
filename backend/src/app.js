const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const { appEnv, supabaseServiceKey, supabaseUrl } = require('./config')

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/

const normalizeEnv = value => {
  const parsed = String(value || '').trim().toLowerCase()
  return parsed === 'production' || parsed === 'prod' || parsed === 'main'
    ? 'production'
    : 'development'
}

const normalizeUsername = value => String(value || '').trim().toLowerCase()

const app = express()
app.use(cors())
app.use(express.json())

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
)

const usernameExists = async username => {
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
    const match = users.find(user => normalizeUsername(user.user_metadata?.username) === username)
    if (match) {
      return true
    }

    hasMore = users.length === perPage

    page += 1
  }

  return false
}

app.get('/health', (req, res) => res.json({ status: 'ok', env: appEnv }))

app.use('/auth', (req, res, next) => {
  const clientEnvHeader = req.get('x-app-env')

  if (!clientEnvHeader) {
    return next()
  }

  const clientEnv = normalizeEnv(clientEnvHeader)

  if (clientEnv !== appEnv) {
    return res.status(409).json({
      error: `Environment mismatch. Client requested ${clientEnv}, server is ${appEnv}.`,
    })
  }

  return next()
})

app.get('/auth/username-available', async (req, res, next) => {
  try {
    const username = normalizeUsername(req.query.username)

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-24 characters and use lowercase letters, numbers, or underscores.',
      })
    }

    const exists = await usernameExists(username)

    return res.json({ available: !exists })
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