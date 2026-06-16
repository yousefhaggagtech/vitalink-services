import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { db } from './config/database';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';  
import { logger } from './utils/logger';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

if (!env.isProduction) {
  setupSwagger(app);
}

app.get('/health', async (_req, res) => {
  try {
    await db.getPool().request().query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      service: env.serviceName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

if (require.main === module) {
  const TARGET_PORT = env.port || 4000;

  const server = app.listen(TARGET_PORT, '0.0.0.0', async () => {
    logger.info(`🚀 ${env.serviceName} running on port ${TARGET_PORT}`);
    logger.info(`🤖 AI Service ready`);
    logger.info(`📚 Swagger docs: http://localhost:${TARGET_PORT}/api-docs`);
    
    try {
      await db.connect();
    } catch (dbError) {
      logger.error('❌ Database connection failed after server start:', dbError);
    }
  });

  server.on('error', (error: any) => {
    logger.error('🔥 Server listening error:', error);
  });

}

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await db.close();
  process.exit(0);
});

export default app;
