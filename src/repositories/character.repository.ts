import { Op } from 'sequelize';
import Character from '../models/Character';
import { CharacterFilters, PaginationOptions, PaginatedResult } from '../types/character.types';

// Re-exportamos para mantener compatibilidad con imports existentes
export { CharacterFilters, PaginationOptions, PaginatedResult };

/**
 * Repository de Characters
 * Capa de acceso a datos que se comunica directamente con la base de datos.
 * Implementa el patrón Repository para separar la lógica de acceso a datos.
 */
class CharacterRepository {
  /**
   * Obtiene todos los personajes de la base de datos con paginación opcional
   */
  async findAll(pagination?: PaginationOptions): Promise<PaginatedResult<Character>> {
    const { rows, count } = await Character.findAndCountAll({
      offset: pagination?.offset,
      limit: pagination?.limit,
      order: [['id', 'ASC']],
    });
    return { rows, count };
  }

  /**
   * Busca un personaje por su ID
   */
  async findById(id: number): Promise<Character | null> {
    return Character.findByPk(id);
  }

  /**
   * Busca personajes aplicando filtros opcionales con paginación
   * Los filtros soportados son: name, status, species, gender, origin
   * La búsqueda por nombre es parcial (LIKE %nombre%)
   */
  async findWithFilters(filters: CharacterFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Character>> {
    const whereClause: any = {};

    // Búsqueda parcial por nombre (case-insensitive)
    if (filters.name) {
      whereClause.name = { [Op.iLike]: `%${filters.name}%` };
    }

    // Filtros exactos
    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.species) {
      whereClause.species = filters.species;
    }

    if (filters.gender) {
      whereClause.gender = filters.gender;
    }

    // Búsqueda parcial por origen (case-insensitive)
    if (filters.origin) {
      whereClause.origin = { [Op.iLike]: `%${filters.origin}%` };
    }

    const { rows, count } = await Character.findAndCountAll({
      where: whereClause,
      offset: pagination?.offset,
      limit: pagination?.limit,
      order: [['id', 'ASC']],
    });
    
    return { rows, count };
  }

  /**
   * Crea un nuevo personaje
   */
  async create(characterData: Partial<Character>): Promise<Character> {
    return Character.create(characterData as any);
  }

  /**
   * Crea múltiples personajes (usado para el seeding)
   * Si el personaje ya existe, actualiza sus datos
   */
  async bulkCreateOrUpdate(characters: Partial<Character>[]): Promise<Character[]> {
    return Character.bulkCreate(characters as any[], {
      updateOnDuplicate: ['name', 'status', 'species', 'type', 'gender', 'origin', 'image', 'updatedAt']
    });
  }

  /**
   * Actualiza un personaje existente
   */
  async update(id: number, characterData: Partial<Character>): Promise<[number, Character[]]> {
    return Character.update(characterData, {
      where: { id },
      returning: true
    }) as Promise<[number, Character[]]>;
  }

  /**
   * Elimina un personaje por ID
   */
  async delete(id: number): Promise<number> {
    return Character.destroy({ where: { id } });
  }

  /**
   * Cuenta el total de personajes (útil para paginación)
   */
  async count(): Promise<number> {
    return Character.count();
  }
}

export default new CharacterRepository();
