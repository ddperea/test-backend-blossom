import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { testConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { createApolloServer } from './graphql';
import cacheService from './cache/cache.service';
import syncCharactersJob from './jobs/syncCharacters.job';
import swaggerDocument from './docs/swagger.json';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ENABLE_CRON = process.env.ENABLE_CRON !== 'false'; // Habilitado por defecto

app.use(express.json());
app.use(loggingMiddleware);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rick & Morty API - Docs'
}));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  const redisConnected = cacheService.isConnected();
  const cronRunning = syncCharactersJob.isRunning();
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running 🚀',
    redis: redisConnected ? 'connected' : 'disconnected',
    cron: cronRunning ? 'running' : 'stopped'
  });
});

const startServer = async () => {
  // Conectar a PostgreSQL
  await testConnection();
  
  // Conectar a Redis
  await testRedisConnection();
  
  // Inicializar Apollo Server
  await createApolloServer(app);

  // Iniciar cron job de sincronización (cada 12 horas)
  if (ENABLE_CRON) {
    syncCharactersJob.start();
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();

export default app;
