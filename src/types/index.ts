/**
 * Barrel export para todos los tipos del proyecto
 * Facilita las importaciones: import { CharacterAttributes, CharacterFilters } from '../types';
 */

export {
  // Character types
  CharacterAttributes,
  PlainCharacter,
  CharacterFilters,
  
  // Pagination types
  PaginationInput,
  PaginationOptions,
  PaginatedResult,
  PaginatedCharacterResponse,
  
  // External API types
  RickMortyCharacter,
  RickMortyApiResponse,
} from './character.types';
