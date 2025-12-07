import redis from '../../config/redis';
import cacheService from '../../cache/cache.service';

/**
 * Tests de Integración - Redis Cache
 * 
 * Estos tests se conectan a Redis REAL para verificar
 * que las operaciones de cache funcionan correctamente.
 */
describe('Redis Integration Tests', () => {
  const testKey = 'test:integration:key';
  const testData = { name: 'Rick Sanchez', status: 'Alive' };

  beforeAll(async () => {
    // Conectar a Redis
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    console.log('✅ Redis connection established for integration tests');
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await redis.del(testKey);
    await redis.del('characters:filters:*');
    
    // Cerrar conexión
    await redis.quit();
    console.log('🔌 Redis connection closed');
  });

  afterEach(async () => {
    // Limpiar key de prueba después de cada test
    await redis.del(testKey);
  });

  describe('Connection', () => {
    it('should connect to Redis successfully', async () => {
      const pong = await redis.ping();
      expect(pong).toBe('PONG');
    });

    it('should report ready status', () => {
      expect(redis.status).toBe('ready');
    });

    it('should have cacheService connected', () => {
      expect(cacheService.isConnected()).toBe(true);
    });
  });

  describe('Basic Redis Operations', () => {
    it('should SET and GET a string value', async () => {
      await redis.set(testKey, 'test-value');
      const result = await redis.get(testKey);

      expect(result).toBe('test-value');
    });

    it('should SET with TTL (expiration)', async () => {
      await redis.setex(testKey, 5, 'expires-in-5-seconds');
      
      const ttl = await redis.ttl(testKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(5);
    });

    it('should DELETE a key', async () => {
      await redis.set(testKey, 'to-be-deleted');
      await redis.del(testKey);
      
      const result = await redis.get(testKey);
      expect(result).toBeNull();
    });

    it('should handle JSON data correctly', async () => {
      await redis.set(testKey, JSON.stringify(testData));
      const result = await redis.get(testKey);
      const parsed = JSON.parse(result!);

      expect(parsed).toEqual(testData);
    });
  });

  describe('CacheService Operations', () => {
    it('should SET and GET via cacheService', async () => {
      await cacheService.set(testKey, testData);
      const result = await cacheService.get<typeof testData>(testKey);

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non:existent:key');
      expect(result).toBeNull();
    });

    it('should DELETE via cacheService', async () => {
      await cacheService.set(testKey, testData);
      await cacheService.delete(testKey);
      
      const result = await cacheService.get(testKey);
      expect(result).toBeNull();
    });

    it('should cache characters by ID', async () => {
      const characterId = 999;
      const mockCharacter = {
        id: characterId,
        name: 'Test Character',
        status: 'Alive',
      };

      await cacheService.setCharacterById(characterId, mockCharacter);
      const result = await cacheService.getCharacterById<typeof mockCharacter>(characterId);

      expect(result).toEqual(mockCharacter);

      // Cleanup
      await redis.del(`character:${characterId}`);
    });

    it('should cache characters by filters', async () => {
      const filters = { status: 'Alive', species: 'Human' };
      const mockCharacters = [
        { id: 1, name: 'Rick', status: 'Alive' },
        { id: 2, name: 'Morty', status: 'Alive' },
      ];

      await cacheService.setCharactersByFilters(filters, mockCharacters);
      const result = await cacheService.getCharactersByFilters<typeof mockCharacters>(filters);

      expect(result).toEqual(mockCharacters);
    });

    it('should invalidate all character keys', async () => {
      // Crear algunas keys de prueba
      await cacheService.setCharacterById(1, { id: 1, name: 'Rick' });
      await cacheService.setCharacterById(2, { id: 2, name: 'Morty' });

      // Invalidar todo
      await cacheService.invalidateAll();

      // Verificar que fueron eliminadas
      const char1 = await cacheService.getCharacterById(1);
      const char2 = await cacheService.getCharacterById(2);

      expect(char1).toBeNull();
      expect(char2).toBeNull();
    });
  });

  describe('Cache TTL Behavior', () => {
    it('should set default TTL of 5 minutes (300 seconds)', async () => {
      await cacheService.set(testKey, testData);
      const ttl = await redis.ttl(testKey);

      // TTL debería estar cerca de 300 segundos (puede variar un poco por timing)
      expect(ttl).toBeGreaterThan(295);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    it('should allow custom TTL', async () => {
      const customTTL = 60; // 1 minuto
      await cacheService.set(testKey, testData, customTTL);
      const ttl = await redis.ttl(testKey);

      expect(ttl).toBeGreaterThan(55);
      expect(ttl).toBeLessThanOrEqual(60);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same filters', async () => {
      const filters1 = { name: 'Rick', status: 'Alive' };
      const filters2 = { status: 'Alive', name: 'Rick' }; // Mismo contenido, diferente orden

      await cacheService.setCharactersByFilters(filters1, [{ id: 1 }]);
      const result = await cacheService.getCharactersByFilters(filters2);

      // Debería encontrar el mismo cache aunque el orden sea diferente
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should differentiate keys for different filters', async () => {
      const filters1 = { status: 'Alive' };
      const filters2 = { status: 'Dead' };

      await cacheService.setCharactersByFilters(filters1, [{ id: 1, name: 'Alive' }]);
      await cacheService.setCharactersByFilters(filters2, [{ id: 2, name: 'Dead' }]);

      const result1 = await cacheService.getCharactersByFilters<any[]>(filters1);
      const result2 = await cacheService.getCharactersByFilters<any[]>(filters2);

      expect(result1).not.toEqual(result2);
      expect(result1?.[0].name).toBe('Alive');
      expect(result2?.[0].name).toBe('Dead');
    });
  });
});
