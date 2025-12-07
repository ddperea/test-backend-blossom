/**
 * Tests para el Rick & Morty API Client
 */

// Mock de fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

import rickMortyApiClient from './rickMortyApi.client';

describe('RickMortyApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCharacters', () => {
    it('should fetch characters from API', async () => {
      const mockResponse = {
        data: {
          characters: {
            info: { next: null, pages: 1, count: 2 },
            results: [
              { id: '1', name: 'Rick Sanchez', status: 'Alive', species: 'Human', type: '', gender: 'Male', origin: { name: 'Earth' }, image: 'url' },
              { id: '2', name: 'Morty Smith', status: 'Alive', species: 'Human', type: '', gender: 'Male', origin: { name: 'Earth' }, image: 'url' },
            ],
          },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await rickMortyApiClient.getCharacters(2);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://rickandmortyapi.com/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Rick Sanchez');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(rickMortyApiClient.getCharacters(5)).rejects.toThrow('Network error');
    });
  });

  describe('getCharactersForDb', () => {
    it('should transform API data to database format', async () => {
      const mockResponse = {
        data: {
          characters: {
            info: { next: null, pages: 1, count: 1 },
            results: [
              {
                id: '1',
                name: 'Rick Sanchez',
                status: 'Alive',
                species: 'Human',
                type: 'Genius',
                gender: 'Male',
                origin: { name: 'Earth (C-137)' },
                image: 'https://example.com/rick.png',
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await rickMortyApiClient.getCharactersForDb(1);

      expect(result[0]).toEqual({
        id: 1,
        name: 'Rick Sanchez',
        status: 'Alive',
        species: 'Human',
        type: 'Genius',
        gender: 'Male',
        origin: 'Earth (C-137)',
        image: 'https://example.com/rick.png',
      });
    });
  });

  describe('transformToDbFormat', () => {
    it('should correctly transform character data', () => {
      const apiCharacter = {
        id: '5',
        name: 'Jerry Smith',
        status: 'Alive',
        species: 'Human',
        type: '',
        gender: 'Male',
        origin: { name: 'Earth (Replacement Dimension)' },
        image: 'https://example.com/jerry.png',
      };

      const result = rickMortyApiClient.transformToDbFormat(apiCharacter);

      expect(result.id).toBe(5);
      expect(result.origin).toBe('Earth (Replacement Dimension)');
      expect(result.type).toBe('');
    });
  });
});
