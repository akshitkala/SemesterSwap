const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const healthRoutes = require('./routes/healthRoutes');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');

const app = express();

// ── Security headers (H5) ─────────────────────────────────────────────────────
app.use(helmet());

// Trust Proxy — verify hop count matches your hosting (Render = 1, Cloudflare+Render = 2)
app.set('trust proxy', 1);

// ── CORS — locked to explicit origins (C1) ────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body size limit — prevent DoS via large payloads (C2) ────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limits ───────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);         // 100 req / 15 min (all API routes)
app.use('/api/auth', authLimiter);   // 10 req / 15 min  (auth endpoints, M5)

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/books',       require('./routes/bookRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/users',       require('./routes/userRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
