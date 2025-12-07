import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración de conexión a Redis
 * Por defecto se conecta a Redis local en localhost:6379
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // No conectar automáticamente
};

// Crear instancia de Redis
const redis = new Redis(redisConfig);

// Manejo de eventos de conexión
redis.on('connect', () => {
  console.log('🔴 Redis: Connecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redis.on('error', (error) => {
  console.error('❌ Redis Error:', error.message);
});

redis.on('close', () => {
  // Evitar log en ambiente de test para prevenir warnings de Jest
  if (process.env.NODE_ENV !== 'test') {
    console.log('🔴 Redis: Connection closed');
  }
});

/**
 * Función para verificar la conexión a Redis
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.connect();
    const pong = await redis.ping();
    console.log(`✅ Redis PING response: ${pong}`);
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', (error as Error).message);
    return false;
  }
}

export default redis;
