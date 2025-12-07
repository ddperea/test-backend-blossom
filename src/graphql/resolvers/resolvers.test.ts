import { resolvers } from './resolvers';
import characterService from '../../services/character.service';
import rickMortyApiClient from '../../services/rickMortyApi.client';

// Mock del character service
jest.mock('../../services/character.service', () => ({
  getAllCharacters: jest.fn(),
  getCharacterById: jest.fn(),
  searchCharacters: jest.fn(),
  getCharacterCount: jest.fn(),
  syncCharacters: jest.fn(),
}));

// Mock del rick morty api client
jest.mock('../../services/rickMortyApi.client', () => ({
  getCharactersForDb: jest.fn(),
}));

describe('GraphQL Resolvers', () => {
  // Mock data
  const mockCharacter = {
    id: 1,
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: 'Earth (C-137)',
    image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  };

  const mockCharacters = [
    mockCharacter,
    {
      id: 2,
      name: 'Morty Smith',
      status: 'Alive',
      species: 'Human',
      type: '',
      gender: 'Male',
      origin: 'Earth (C-137)',
      image: 'https://rickandmortyapi.com/api/character/avatar/2.jpeg',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console.log y console.error en tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Query', () => {
    describe('characters', () => {
      it('should return all characters', async () => {
        (characterService.getAllCharacters as jest.Mock).mockResolvedValue(mockCharacters);

        const result = await resolvers.Query.characters();

        expect(characterService.getAllCharacters).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockCharacters);
      });

      it('should return empty array when no characters exist', async () => {
        (characterService.getAllCharacters as jest.Mock).mockResolvedValue([]);

        const result = await resolvers.Query.characters();

        expect(result).toEqual([]);
      });
    });

    describe('character', () => {
      it('should return character by id', async () => {
        (characterService.getCharacterById as jest.Mock).mockResolvedValue(mockCharacter);

        const result = await resolvers.Query.character(null, { id: 1 });

        expect(characterService.getCharacterById).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockCharacter);
      });

      it('should return null when character not found', async () => {
        (characterService.getCharacterById as jest.Mock).mockRejectedValue(
          new Error('Character not found')
        );

        const result = await resolvers.Query.character(null, { id: 999 });

        expect(characterService.getCharacterById).toHaveBeenCalledWith(999);
        expect(result).toBeNull();
      });
    });

    describe('searchCharacters', () => {
      it('should search characters with filters', async () => {
        const filters = { name: 'Rick', status: 'Alive' };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue([mockCharacter]);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(characterService.searchCharacters).toHaveBeenCalledWith(filters);
        expect(result).toEqual([mockCharacter]);
      });

      it('should search with empty filters when not provided', async () => {
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(mockCharacters);

        const result = await resolvers.Query.searchCharacters(null, {});

        expect(characterService.searchCharacters).toHaveBeenCalledWith({});
        expect(result).toEqual(mockCharacters);
      });

      it('should search with undefined filters', async () => {
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(mockCharacters);

        const result = await resolvers.Query.searchCharacters(null, { filters: undefined });

        expect(characterService.searchCharacters).toHaveBeenCalledWith({});
        expect(result).toEqual(mockCharacters);
      });

      it('should filter by single field', async () => {
        const filters = { species: 'Human' };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(mockCharacters);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(characterService.searchCharacters).toHaveBeenCalledWith(filters);
        expect(result).toEqual(mockCharacters);
      });

      it('should filter by multiple fields', async () => {
        const filters = { name: 'Rick', status: 'Alive', species: 'Human', gender: 'Male' };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue([mockCharacter]);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(characterService.searchCharacters).toHaveBeenCalledWith(filters);
        expect(result).toEqual([mockCharacter]);
      });

      it('should return empty array when no matches', async () => {
        const filters = { name: 'NonexistentCharacter' };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue([]);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(result).toEqual([]);
      });
    });

    describe('characterCount', () => {
      it('should return total character count', async () => {
        (characterService.getCharacterCount as jest.Mock).mockResolvedValue(100);

        const result = await resolvers.Query.characterCount();

        expect(characterService.getCharacterCount).toHaveBeenCalledTimes(1);
        expect(result).toBe(100);
      });

      it('should return 0 when no characters exist', async () => {
        (characterService.getCharacterCount as jest.Mock).mockResolvedValue(0);

        const result = await resolvers.Query.characterCount();

        expect(result).toBe(0);
      });
    });
  });

  describe('Mutation', () => {
    describe('syncCharacters', () => {
      it('should sync characters successfully', async () => {
        const apiCharacters = [
          { name: 'Rick', status: 'Alive' },
          { name: 'Morty', status: 'Alive' },
        ];
        (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(apiCharacters);
        (characterService.syncCharacters as jest.Mock).mockResolvedValue(mockCharacters);

        const result = await resolvers.Mutation.syncCharacters();

        expect(rickMortyApiClient.getCharactersForDb).toHaveBeenCalledWith(15);
        expect(characterService.syncCharacters).toHaveBeenCalledWith(apiCharacters);
        expect(result).toEqual({
          success: true,
          message: 'Successfully synced 2 characters from Rick & Morty API',
          count: 2,
        });
      });

      it('should handle sync failure with Error instance', async () => {
        const errorMessage = 'API connection failed';
        (rickMortyApiClient.getCharactersForDb as jest.Mock).mockRejectedValue(
          new Error(errorMessage)
        );

        const result = await resolvers.Mutation.syncCharacters();

        expect(result).toEqual({
          success: false,
          message: errorMessage,
          count: 0,
        });
      });

      it('should handle sync failure with non-Error object', async () => {
        (rickMortyApiClient.getCharactersForDb as jest.Mock).mockRejectedValue('Unknown error');

        const result = await resolvers.Mutation.syncCharacters();

        expect(result).toEqual({
          success: false,
          message: 'Unknown error during sync',
          count: 0,
        });
      });

      it('should handle empty characters array from API', async () => {
        (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue([]);
        (characterService.syncCharacters as jest.Mock).mockResolvedValue([]);

        const result = await resolvers.Mutation.syncCharacters();

        expect(result).toEqual({
          success: true,
          message: 'Successfully synced 0 characters from Rick & Morty API',
          count: 0,
        });
      });

      it('should handle service sync failure', async () => {
        const apiCharacters = [{ name: 'Rick', status: 'Alive' }];
        (rickMortyApiClient.getCharactersForDb as jest.Mock).mockResolvedValue(apiCharacters);
        (characterService.syncCharacters as jest.Mock).mockRejectedValue(
          new Error('Database error')
        );

        const result = await resolvers.Mutation.syncCharacters();

        expect(result).toEqual({
          success: false,
          message: 'Database error',
          count: 0,
        });
      });
    });
  });
});
