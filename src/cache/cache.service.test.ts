/**
 * Tests para el Cache Service
 * Probamos la lógica de generación de claves y comportamiento del caché
 */

// Mock de Redis antes de importar el servicio
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    status: 'ready',
  },
}));

import cacheService from './cache.service';
import redis from '../config/redis';

describe('CacheService', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('get', () => {
    it('should return parsed data on cache hit', async () => {
      const mockData = { id: 1, name: 'Rick' };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await cacheService.get<typeof mockData>('test-key');

      expect(result).toEqual(mockData);
      expect(redis.get).toHaveBeenCalledWith('test-key');
      expect(consoleSpy).toHaveBeenCalledWith('📦 Cache HIT: test-key');
    });

    it('should return null on cache miss', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await cacheService.get('missing-key');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('📭 Cache MISS: missing-key');
    });

    it('should return null on error', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store data with default TTL', async () => {
      const data = { name: 'Morty' };
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await cacheService.set('test-key', data);

      expect(redis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(data));
      expect(consoleSpy).toHaveBeenCalledWith('💾 Cache SET: test-key (TTL: 300s)');
    });

    it('should store data with custom TTL', async () => {
      const data = { name: 'Summer' };
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await cacheService.set('custom-key', data, 600);

      expect(redis.setex).toHaveBeenCalledWith('custom-key', 600, JSON.stringify(data));
    });
  });

  describe('delete', () => {
    it('should delete a key from cache', async () => {
      (redis.del as jest.Mock).mockResolvedValue(1);

      await cacheService.delete('delete-key');

      expect(redis.del).toHaveBeenCalledWith('delete-key');
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ Cache DELETE: delete-key');
    });
  });

  describe('invalidateAll', () => {
    it('should delete all character keys', async () => {
      (redis.keys as jest.Mock).mockResolvedValue(['characters:all', 'characters:id:1']);
      (redis.del as jest.Mock).mockResolvedValue(2);

      await cacheService.invalidateAll();

      expect(redis.keys).toHaveBeenCalledWith('characters:*');
      expect(redis.del).toHaveBeenCalledWith('characters:all', 'characters:id:1');
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Cache INVALIDATE: 2 keys deleted');
    });

    it('should handle empty cache', async () => {
      (redis.keys as jest.Mock).mockResolvedValue([]);

      await cacheService.invalidateAll();

      expect(redis.del).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Cache INVALIDATE: No keys to delete');
    });
  });

  describe('getCharactersByFilters', () => {
    it('should generate correct key for empty filters', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      await cacheService.getCharactersByFilters({});

      expect(redis.get).toHaveBeenCalledWith('characters:all');
    });

    it('should generate consistent key for filters', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      // Llamar con filtros en diferente orden debería generar la misma clave
      await cacheService.getCharactersByFilters({ status: 'Alive', name: 'Rick' });
      const firstCall = (redis.get as jest.Mock).mock.calls[0][0];

      (redis.get as jest.Mock).mockClear();
      await cacheService.getCharactersByFilters({ name: 'Rick', status: 'Alive' });
      const secondCall = (redis.get as jest.Mock).mock.calls[0][0];

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('isConnected', () => {
    it('should return true when redis status is ready', () => {
      expect(cacheService.isConnected()).toBe(true);
    });
  });
});
