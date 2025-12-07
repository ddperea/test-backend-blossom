/**
 * Tipos e interfaces centralizados para Character
 * Consolidados aquí para evitar duplicación y facilitar mantenimiento
 */

/**
 * Atributos base de un personaje
 * Usado tanto para el modelo Sequelize como para objetos serializados
 */
export interface CharacterAttributes {
  id: number;
  name: string;
  status: string;
  species: string;
  type?: string;
  gender: string;
  origin: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Alias para objetos Character serializados (compatibles con GraphQL)
 * Es el mismo tipo que CharacterAttributes pero con nombre semántico
 */
export type PlainCharacter = CharacterAttributes;

/**
 * Filtros de búsqueda para personajes
 * Corresponde a los filtros requeridos: nombre, estado, especie, género, origen
 */
export interface CharacterFilters {
  name?: string;
  status?: string;
  species?: string;
  gender?: string;
  origin?: string;
}

/**
 * Input de paginación (usado en GraphQL)
 */
export interface PaginationInput {
  page?: number;
  limit?: number;
}

/**
 * Opciones de paginación para queries de base de datos
 * Usado internamente por el repositorio
 */
export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

/**
 * Resultado paginado genérico del repositorio
 */
export interface PaginatedResult<T> {
  rows: T[];
  count: number;
}

/**
 * Respuesta paginada de personajes (usado en GraphQL)
 */
export interface PaginatedCharacterResponse {
  data: PlainCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interfaz para los datos de personaje de la API externa de Rick & Morty
 * Nota: El id viene como string desde la API
 */
export interface RickMortyCharacter {
  id: string;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
  };
  image: string;
}

/**
 * Interfaz para la respuesta de la API de Rick & Morty
 */
export interface RickMortyApiResponse {
  data: {
    characters: {
      info: {
        next: number | null;
        pages: number;
        count: number;
      };
      results: RickMortyCharacter[];
    };
  };
}
