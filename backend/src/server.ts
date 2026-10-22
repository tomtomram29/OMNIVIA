import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/env';
import { prisma } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { createRateLimiter } from './config/rateLimit';

// Routes
import authRoutes from './modules/auth/auth.routes';
import companiesRoutes from './modules/companies/companies.routes';
import usersRoutes from './modules/users/users.routes';
import plansRoutes from './modules/plans/plans.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';
import clientsRoutes from './modules/clients/clients.routes';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import productsRoutes from './modules/products/products.routes';
import servicesRoutes from './modules/services/services.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import quotesRoutes from './modules/quotes/quotes.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import documentsRoutes from './modules/documents/documents.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import auditRoutes from './modules/audit/audit.routes';

// Cron jobs
import './utils/cron';

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// GENERAL MIDDLEWARE
// ============================================================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================================
// RATE LIMITING
// ============================================================
const apiLimiter = createRateLimiter(100, 15); // 100 req per 15 minutes
const authLimiter = createRateLimiter(10, 15); // 10 req per 15 minutes

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.NODE_ENV });
});

// ============================================================
// API ROUTES
// ============================================================
const API = '/api';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/companies`, companiesRoutes);
app.use(`${API}/users`, usersRoutes);
app.use(`${API}/plans`, plansRoutes);
app.use(`${API}/subscriptions`, subscriptionsRoutes);
app.use(`${API}/clients`, clientsRoutes);
app.use(`${API}/suppliers`, suppliersRoutes);
app.use(`${API}/products`, productsRoutes);
app.use(`${API}/services`, servicesRoutes);
app.use(`${API}/tasks`, tasksRoutes);
app.use(`${API}/calendar`, calendarRoutes);
app.use(`${API}/quotes`, quotesRoutes);
app.use(`${API}/invoices`, invoicesRoutes);
app.use(`${API}/payments`, paymentsRoutes);
app.use(`${API}/documents`, documentsRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/audit`, auditRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(config.PORT, () => {
      console.log(`🚀 OMNIVIA Backend running on port ${config.PORT}`);
      console.log(`📍 Environment: ${config.NODE_ENV}`);
      console.log(`🌐 API: http://localhost:${config.PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
