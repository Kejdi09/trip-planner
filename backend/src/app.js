const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
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

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

module.exports = { app, supabaseAdmin }