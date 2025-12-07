import redis from '../config/redis';

/**
 * Cache Service
 * Maneja el almacenamiento y recuperación de datos en Redis.
 * 
 * Estrategia de caché:
 * - TTL por defecto: 5 minutos (300 segundos)
 * - Las claves siguen el patrón: "characters:{tipo}:{identificador}"
 * - Al sincronizar personajes, se invalida todo el caché
 */
class CacheService {
  private readonly DEFAULT_TTL = 300; // 5 minutos en segundos
  private readonly KEY_PREFIX = 'characters';

  /**
   * Genera una clave de caché consistente para búsquedas
   * @param filters Filtros de búsqueda
   * @returns Clave única para el caché
   */
  private generateSearchKey(filters: Record<string, any>): string {
    // Ordenar las claves para garantizar consistencia
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          acc[key] = filters[key];
        }
        return acc;
      }, {} as Record<string, any>);

    // Si no hay filtros, usar una clave especial para "todos"
    if (Object.keys(sortedFilters).length === 0) {
      return `${this.KEY_PREFIX}:all`;
    }

    const filterString = JSON.stringify(sortedFilters);
    return `${this.KEY_PREFIX}:search:${Buffer.from(filterString).toString('base64')}`;
  }

  /**
   * Genera una clave de caché para un personaje individual
   * @param id ID del personaje
   */
  private generateCharacterKey(id: number): string {
    return `${this.KEY_PREFIX}:id:${id}`;
  }

  /**
   * Obtiene datos del caché
   * @param key Clave del caché
   * @returns Datos deserializados o null si no existe
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (data) {
        console.log(`📦 Cache HIT: ${key}`);
        return JSON.parse(data) as T;
      }
      console.log(`📭 Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ Cache get error:', (error as Error).message);
      return null;
    }
  }

  /**
   * Guarda datos en el caché
   * @param key Clave del caché
   * @param data Datos a guardar
   * @param ttl Tiempo de expiración en segundos (opcional)
   */
  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('❌ Cache set error:', (error as Error).message);
    }
  }

  /**
   * Elimina una clave del caché
   * @param key Clave a eliminar
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
      console.log(`🗑️ Cache DELETE: ${key}`);
    } catch (error) {
      console.error('❌ Cache delete error:', (error as Error).message);
    }
  }

  /**
   * Invalida todo el caché de personajes
   * Se usa después de sincronizar con la API externa
   */
  async invalidateAll(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.KEY_PREFIX}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🧹 Cache INVALIDATE: ${keys.length} keys deleted`);
      } else {
        console.log('🧹 Cache INVALIDATE: No keys to delete');
      }
    } catch (error) {
      console.error('❌ Cache invalidate error:', (error as Error).message);
    }
  }

  // ============================================
  // Métodos de alto nivel para Characters
  // ============================================

  /**
   * Obtiene personajes del caché por filtros de búsqueda
   */
  async getCharactersByFilters<T>(filters: Record<string, any>): Promise<T | null> {
    const key = this.generateSearchKey(filters);
    return this.get<T>(key);
  }

  /**
   * Guarda personajes en caché por filtros de búsqueda
   */
  async setCharactersByFilters<T>(filters: Record<string, any>, data: T): Promise<void> {
    const key = this.generateSearchKey(filters);
    await this.set(key, data);
  }

  /**
   * Obtiene un personaje del caché por ID
   */
  async getCharacterById<T>(id: number): Promise<T | null> {
    const key = this.generateCharacterKey(id);
    return this.get<T>(key);
  }

  /**
   * Guarda un personaje en caché por ID
   */
  async setCharacterById<T>(id: number, data: T): Promise<void> {
    const key = this.generateCharacterKey(id);
    await this.set(key, data);
  }

  /**
   * Verifica si Redis está conectado
   */
  isConnected(): boolean {
    return redis.status === 'ready';
  }
}

// Exportar instancia singleton
export default new CacheService();
