const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: add trip routes here

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

module.exports = app;
