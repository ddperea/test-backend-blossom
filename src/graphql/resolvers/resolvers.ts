import characterService from '../../services/character.service';
import { CharacterFilters, PaginationInput } from '../../types/character.types';
import rickMortyApiClient from '../../services/rickMortyApi.client';

/**
 * Resolvers de GraphQL
 * Conectan las queries/mutations con la lógica de negocio (Service)
 */
export const resolvers = {
  Query: {
    /**
     * Obtiene todos los personajes con paginación opcional
     */
    characters: async (_: any, { pagination }: { pagination?: PaginationInput }) => {
      return characterService.getAllCharacters(pagination);
    },

    /**
     * Obtiene un personaje por ID
     */
    character: async (_: any, { id }: { id: number }) => {
      try {
        return await characterService.getCharacterById(id);
      } catch (error) {
        return null;
      }
    },

    /**
     * Busca personajes con filtros opcionales y paginación
     * Filtros: name, status, species, gender, origin
     */
    searchCharacters: async (_: any, { filters, pagination }: { filters?: CharacterFilters; pagination?: PaginationInput }) => {
      return characterService.searchCharacters(filters || {}, pagination);
    },

    /**
     * Obtiene el conteo total de personajes
     */
    characterCount: async () => {
      return characterService.getCharacterCount();
    },
  },

  Mutation: {
    /**
     * Sincroniza personajes desde la API externa de Rick & Morty
     * Obtiene los datos de la API y los guarda/actualiza en la BD
     */
    syncCharacters: async () => {
      try {
        console.log('📡 Syncing characters from Rick & Morty API...');
        
        // Obtener personajes de la API externa
        const characters = await rickMortyApiClient.getCharactersForDb(15);
        
        // Sincronizar con la base de datos
        await characterService.syncCharacters(characters);
        
        console.log(`✅ Synced ${characters.length} characters.`);
        
        return {
          success: true,
          message: `Successfully synced ${characters.length} characters from Rick & Morty API`,
          count: characters.length,
        };
      } catch (error) {
        console.error('❌ Sync failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error during sync',
          count: 0,
        };
      }
    },
  },
};
