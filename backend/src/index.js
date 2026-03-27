const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Allow local web/mobile clients to call this API during development.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/sum', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({
      error: 'Both query parameters "a" and "b" must be valid numbers.'
    });
  }

  return res.json({
    a,
    b,
    sum: a + b
  });
});

// TODO: add trip routes here

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

module.exports = app;
