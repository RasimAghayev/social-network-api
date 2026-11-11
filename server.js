require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const { assertSecretsConfigured } = require('./config/secrets');

const app = express();

// Refuse to start a production run without a database connection string and a
// token signing secret. A missing value stops the process here instead of
// failing later on the first request.
try {
  assertSecretsConfigured();
} catch (err) {
  console.error(`[startup] ${err.message}`);
  process.exit(1);
}

//Connect DB
connectDB();

//Init MIddleware
app.use(express.json({ extended: false }));
app.get('/', (req, res) => res.send('API Running'));

// Define Routers

app.use('/api/auth', require('./routers/api/auth'));
app.use('/api/posts', require('./routers/api/posts'));
app.use('/api/profile', require('./routers/api/profile'));
app.use('/api/users', require('./routers/api/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
