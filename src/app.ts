import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { testConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import redis from './config/redis';
import sequelize from './config/database';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { createApolloServer } from './graphql';
import cacheService from './cache/cache.service';
import syncCharactersJob from './jobs/syncCharacters.job';
import swaggerDocument from './docs/swagger.json';
import http from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ENABLE_CRON = process.env.ENABLE_CRON === 'true'; // Deshabilitado por defecto

let server: http.Server;

app.use(express.json());
app.use(loggingMiddleware);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rick & Morty API - Docs'
}));

// Health Check Endpoint
app.get('/health', async (req: Request, res: Response) => {
  const redisConnected = cacheService.isConnected();
  const cronRunning = syncCharactersJob.isRunning();
  
  // Verificar PostgreSQL
  let dbConnected = false;
  try {
    await sequelize.authenticate();
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  const isHealthy = redisConnected && dbConnected;
  
  res.status(isHealthy ? 200 : 503).json({ 
    status: isHealthy ? 'OK' : 'DEGRADED',
    message: isHealthy ? 'All services running 🚀' : 'Some services unavailable',
    services: {
      postgresql: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
      cron: cronRunning ? 'running' : 'stopped'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Graceful shutdown - Cierra conexiones ordenadamente
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Detener cron job
  syncCharactersJob.stop();
  console.log('✅ Cron job stopped');
  
  // 2. Cerrar servidor HTTP (dejar de aceptar nuevas conexiones)
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }
  
  // 3. Cerrar Redis
  try {
    await redis.quit();
    console.log('✅ Redis connection closed');
  } catch (error) {
    console.error('❌ Error closing Redis:', (error as Error).message);
  }
  
  // 4. Cerrar PostgreSQL
  try {
    await sequelize.close();
    console.log('✅ PostgreSQL connection closed');
  } catch (error) {
    console.error('❌ Error closing PostgreSQL:', (error as Error).message);
  }
  
  console.log('👋 Graceful shutdown completed');
  process.exit(0);
};

// Manejar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  try {
    // Conectar a PostgreSQL (fail-fast)
    await testConnection();
    
    // Conectar a Redis (fail-fast)
    await testRedisConnection();
    
    // Inicializar Apollo Server
    await createApolloServer(app);

    // Iniciar cron job de sincronización (cada 12 horas)
    if (ENABLE_CRON) {
      syncCharactersJob.start();
    }
    
    server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('\n💥 Failed to start server:', (error as Error).message);
    console.error('Exiting with code 1...\n');
    process.exit(1); // Fail-fast: salir si no se puede conectar
  }
};

startServer();

export default app;
