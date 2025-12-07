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
      const mockPaginatedResponse = {
        data: mockCharacters,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      it('should return paginated characters', async () => {
        (characterService.getAllCharacters as jest.Mock).mockResolvedValue(mockPaginatedResponse);

        const result = await resolvers.Query.characters(null, {});

        expect(characterService.getAllCharacters).toHaveBeenCalledWith(undefined);
        expect(result).toEqual(mockPaginatedResponse);
      });

      it('should return empty data when no characters exist', async () => {
        const emptyResponse = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        (characterService.getAllCharacters as jest.Mock).mockResolvedValue(emptyResponse);

        const result = await resolvers.Query.characters(null, {});

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      it('should pass pagination parameters', async () => {
        (characterService.getAllCharacters as jest.Mock).mockResolvedValue(mockPaginatedResponse);

        await resolvers.Query.characters(null, { pagination: { page: 2, limit: 10 } });

        expect(characterService.getAllCharacters).toHaveBeenCalledWith({ page: 2, limit: 10 });
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
        const paginatedResult = {
          data: [mockCharacter],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(paginatedResult);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(characterService.searchCharacters).toHaveBeenCalledWith(filters, undefined);
        expect(result).toEqual(paginatedResult);
      });

      it('should search with empty filters when not provided', async () => {
        const paginatedResult = {
          data: mockCharacters,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(paginatedResult);

        const result = await resolvers.Query.searchCharacters(null, {});

        expect(characterService.searchCharacters).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(paginatedResult);
      });

      it('should search with undefined filters', async () => {
        const paginatedResult = {
          data: mockCharacters,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(paginatedResult);

        const result = await resolvers.Query.searchCharacters(null, { filters: undefined });

        expect(characterService.searchCharacters).toHaveBeenCalledWith({}, undefined);
        expect(result).toEqual(paginatedResult);
      });

      it('should filter by single field', async () => {
        const filters = { species: 'Human' };
        const paginatedResult = {
          data: mockCharacters,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(paginatedResult);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(characterService.searchCharacters).toHaveBeenCalledWith(filters, undefined);
        expect(result).toEqual(paginatedResult);
      });

      it('should filter by multiple fields', async () => {
        const filters = { name: 'Rick', status: 'Alive', species: 'Human', gender: 'Male' };
        const paginatedResult = {
          data: [mockCharacter],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(paginatedResult);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(characterService.searchCharacters).toHaveBeenCalledWith(filters, undefined);
        expect(result).toEqual(paginatedResult);
      });

      it('should return empty array when no matches', async () => {
        const filters = { name: 'NonexistentCharacter' };
        const paginatedResult = {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };
        (characterService.searchCharacters as jest.Mock).mockResolvedValue(paginatedResult);

        const result = await resolvers.Query.searchCharacters(null, { filters });

        expect(result).toEqual(paginatedResult);
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
