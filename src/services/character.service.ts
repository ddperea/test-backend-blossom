import characterRepository from '../repositories/character.repository';
import Character from '../models/Character';
import cacheService from '../cache/cache.service';
import { ExecutionTime } from '../decorators/executionTime.decorator';
import { PlainCharacter, CharacterFilters, PaginationInput, PaginatedCharacterResponse } from '../types/character.types';

// Re-exportamos para mantener compatibilidad con imports existentes
export { PlainCharacter };

// Valores por defecto para paginación
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Service de Characters
 * Capa de lógica de negocio que orquesta las operaciones.
 * Se comunica con el Repository para acceder a los datos.
 * Integra caché con Redis para optimizar consultas.
 */
class CharacterService {
  /**
   * Normaliza los parámetros de paginación
   */
  private normalizePagination(pagination?: PaginationInput): { page: number; limit: number; offset: number } {
    const page = Math.max(1, pagination?.page || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, pagination?.limit || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
  }

  /**
   * Obtiene todos los personajes con paginación
   * Primero busca en caché, si no existe, consulta BD y guarda en caché
   * Retorna objetos planos (no instancias Sequelize) para compatibilidad con GraphQL
   */
  @ExecutionTime('CharacterService.getAllCharacters')
  async getAllCharacters(pagination?: PaginationInput): Promise<PaginatedCharacterResponse> {
    const { page, limit, offset } = this.normalizePagination(pagination);
    
    // Generar clave de caché que incluye paginación
    const cacheKey = { _page: page, _limit: limit };
    
    // Intentar obtener del caché
    const cached = await cacheService.getCharactersByFilters<PaginatedCharacterResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si no está en caché, consultar BD
    const { rows, count } = await characterRepository.findAll({ offset, limit });
    
    // Convertir a objetos planos para compatibilidad con GraphQL
    const plainCharacters = rows.map(c => c.toJSON() as PlainCharacter);
    
    const response: PaginatedCharacterResponse = {
      data: plainCharacters,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
    
    // Guardar en caché para futuras consultas
    await cacheService.setCharactersByFilters(cacheKey, response);
    
    return response;
  }

  /**
   * Obtiene un personaje por su ID
   * Primero busca en caché, si no existe, consulta BD y guarda en caché
   * Retorna objeto plano para compatibilidad con GraphQL
   * @throws Error si el personaje no existe
   */
  @ExecutionTime('CharacterService.getCharacterById')
  async getCharacterById(id: number): Promise<PlainCharacter> {
    // Intentar obtener del caché
    const cached = await cacheService.getCharacterById<PlainCharacter>(id);
    if (cached) {
      return cached;
    }

    // Si no está en caché, consultar BD
    const character = await characterRepository.findById(id);
    
    if (!character) {
      throw new Error(`Character with ID ${id} not found`);
    }

    // Convertir a objeto plano para compatibilidad con GraphQL
    const plainCharacter = character.toJSON() as PlainCharacter;
    
    // Guardar en caché para futuras consultas
    await cacheService.setCharacterById(id, plainCharacter);
    
    return plainCharacter;
  }

  /**
   * Busca personajes con filtros opcionales y paginación
   * Filtros disponibles: name, status, species, gender, origin
   * Los resultados se cachean por combinación de filtros + paginación
   * Retorna objetos planos para compatibilidad con GraphQL
   */
  @ExecutionTime('CharacterService.searchCharacters')
  async searchCharacters(filters: CharacterFilters, pagination?: PaginationInput): Promise<PaginatedCharacterResponse> {
    const { page, limit, offset } = this.normalizePagination(pagination);
    
    // Generar clave de caché que incluye filtros y paginación
    const cacheKey = { ...filters, _page: page, _limit: limit };

    // Intentar obtener del caché
    const cached = await cacheService.getCharactersByFilters<PaginatedCharacterResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si no está en caché, consultar BD
    const { rows, count } = await characterRepository.findWithFilters(filters, { offset, limit });
    
    // Convertir a objetos planos para compatibilidad con GraphQL
    const plainCharacters = rows.map(c => c.toJSON() as PlainCharacter);
    
    const response: PaginatedCharacterResponse = {
      data: plainCharacters,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
    
    // Guardar en caché para futuras consultas
    await cacheService.setCharactersByFilters(cacheKey, response);
    
    return response;
  }

  /**
   * Crea un nuevo personaje
   */
  async createCharacter(characterData: Partial<Character>): Promise<Character> {
    return characterRepository.create(characterData);
  }

  /**
   * Actualiza un personaje existente
   * @throws Error si el personaje no existe
   */
  async updateCharacter(id: number, characterData: Partial<Character>): Promise<Character> {
    const existingCharacter = await characterRepository.findById(id);
    
    if (!existingCharacter) {
      throw new Error(`Character with ID ${id} not found`);
    }

    const [, updatedCharacters] = await characterRepository.update(id, characterData);
    return updatedCharacters[0];
  }

  /**
   * Elimina un personaje
   * @throws Error si el personaje no existe
   */
  async deleteCharacter(id: number): Promise<boolean> {
    const existingCharacter = await characterRepository.findById(id);
    
    if (!existingCharacter) {
      throw new Error(`Character with ID ${id} not found`);
    }

    await characterRepository.delete(id);
    return true;
  }

  /**
   * Sincroniza personajes desde la API externa (usado por el seeder/cron)
   * Invalida todo el caché después de sincronizar
   */
  async syncCharacters(characters: Partial<Character>[]): Promise<Character[]> {
    const result = await characterRepository.bulkCreateOrUpdate(characters);
    
    // Invalidar caché después de sincronizar
    await cacheService.invalidateAll();
    
    return result;
  }

  /**
   * Obtiene el conteo total de personajes
   */
  async getCharacterCount(): Promise<number> {
    return characterRepository.count();
  }
}

export default new CharacterService();
