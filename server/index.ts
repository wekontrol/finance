import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db/schema';
import { initializeDatabaseManager } from './db/manager';

// Load environment variables from .env.production in production
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(process.cwd(), '.env.production') });
} else {
  dotenv.config();
}
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import goalRoutes from './routes/goals';
import userRoutes from './routes/users';
import familyRoutes from './routes/family';
import budgetRoutes, { startMonthlyHistoryScheduler } from './routes/budget';
import settingsRoutes from './routes/settings';
import familiesRoutes from './routes/families';
import backupRoutes from './routes/backup';
import systemRoutes from './routes/system';
import notificationRoutes from './routes/notifications';
import pushRoutes from './routes/push';
import emailRoutes from './routes/email';
import translationsRoutes from './routes/translations';
import templatesRoutes from './routes/templates';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize database systems
initializeDatabase();
initializeDatabaseManager();

// CORS configuration - must be before session middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in development and production
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const sessionSecret = process.env.SESSION_SECRET || 'gestor-financeiro-secret-key-2024';

// Session store configuration - use memory store (SQLite persists via database)
let sessionStore: any;
// In development, use memory store (that's OK for local dev)

// Session middleware - must be before route handlers
app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIES !== 'false',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  },
  proxy: true // Trust proxy for secure cookies
}));

// Prevent browser caching of API responses (dynamic data)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/translations', translationsRoutes);
app.use('/api/templates', templatesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: serve static files from dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist')));
  
  // SPA fallback route
  app.use((req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode');
    if (process.env.TheFinance) {
      console.log('✅ Sessions stored in PostgreSQL');
    } else {
      console.warn('⚠️  TheFinance not set - using memory store (not recommended for production)');
    }
  } else {
    console.log('Running in development mode');
  }

  // Start budget history background scheduler
  startMonthlyHistoryScheduler();
});
