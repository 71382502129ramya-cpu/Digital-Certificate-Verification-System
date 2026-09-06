import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db';
import authRoutes from './server/routes/auth';
import certificatesRoutes from './server/routes/certificates';
import eventsRoutes from './server/routes/events';
import institutionsRoutes from './server/routes/institutions';
import uploadsRoutes from './server/routes/uploads';
import leaderboardRoutes from './server/routes/leaderboard';
import logsRoutes from './server/routes/logs';
import statsRoutes from './server/routes/stats';



async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize PostgreSQL schema and seed data
  await initDatabase();

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/certificates', certificatesRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/institutions', institutionsRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/verification-logs', logsRoutes);
  app.use('/api/stats', statsRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Certificate Verification Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
