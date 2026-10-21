/**
 * Express application factory (used by server.js and API tests).
 * CORS is limited to CLIENT_URL. JSON bodies are capped at 100kb.
 * Invoice totals from the browser are never treated as authoritative.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { invoiceRoutes } from './routes/invoiceRoutes.js';
import { inspectDatabase } from './controllers/invoiceController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getDatabaseStatus } from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  app.disable('x-powered-by');
  // Explicit origin only — do not use cors({ origin: true }) in this app.
  app.use(cors({
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        mongodb: getDatabaseStatus(),
      },
    });
  });

  app.get('/api/db', inspectDatabase);
  app.use('/api/invoices', invoiceRoutes);

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      return res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
