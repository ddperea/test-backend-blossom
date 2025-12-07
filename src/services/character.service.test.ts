import CharacterService from './character.service';
import characterRepository, { CharacterFilters } from '../repositories/character.repository';
import cacheService from '../cache/cache.service';

// Mock del repository
jest.mock('../repositories/character.repository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findWithFilters: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  bulkCreateOrUpdate: jest.fn(),
  count: jest.fn(),
}));

// Mock del cache service
jest.mock('../cache/cache.service', () => ({
  getCharactersByFilters: jest.fn(),
  setCharactersByFilters: jest.fn(),
  getCharacterById: jest.fn(),
  setCharacterById: jest.fn(),
  invalidateAll: jest.fn(),
}));

describe('CharacterService', () => {
  // Mock de datos de personajes
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
  });

  describe('getAllCharacters', () => {
    it('should return characters from cache when available', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(mockCharacters);

      const result = await CharacterService.getAllCharacters();

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({});
      expect(characterRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(mockCharacters);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findAll as jest.Mock).mockResolvedValue(mockCharacters);

      const result = await CharacterService.getAllCharacters();

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({});
      expect(characterRepository.findAll).toHaveBeenCalledTimes(1);
      expect(cacheService.setCharactersByFilters).toHaveBeenCalledWith({}, mockCharacters);
      expect(result).toEqual(mockCharacters);
    });

    it('should return empty array when no characters in database', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await CharacterService.getAllCharacters();

      expect(result).toEqual([]);
    });
  });

  describe('getCharacterById', () => {
    it('should return character from cache when available', async () => {
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(mockCharacter);

      const result = await CharacterService.getCharacterById(1);

      expect(cacheService.getCharacterById).toHaveBeenCalledWith(1);
      expect(characterRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockCharacter);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(null);
      (characterRepository.findById as jest.Mock).mockResolvedValue(mockCharacter);

      const result = await CharacterService.getCharacterById(1);

      expect(cacheService.getCharacterById).toHaveBeenCalledWith(1);
      expect(characterRepository.findById).toHaveBeenCalledWith(1);
      expect(cacheService.setCharacterById).toHaveBeenCalledWith(1, mockCharacter);
      expect(result).toEqual(mockCharacter);
    });

    it('should throw error when character not found', async () => {
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(null);
      (characterRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CharacterService.getCharacterById(999)).rejects.toThrow(
        'Character with ID 999 not found'
      );
    });
  });

  describe('searchCharacters', () => {
    const filters: CharacterFilters = { name: 'Rick', status: 'Alive' };

    it('should delegate to getAllCharacters when no filters provided', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(mockCharacters);

      const result = await CharacterService.searchCharacters({});

      // Verifica que usa la lógica de getAllCharacters (filtros vacíos)
      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({});
      expect(result).toEqual(mockCharacters);
    });

    it('should return characters from cache when available', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue([mockCharacter]);

      const result = await CharacterService.searchCharacters(filters);

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith(filters);
      expect(characterRepository.findWithFilters).not.toHaveBeenCalled();
      expect(result).toEqual([mockCharacter]);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findWithFilters as jest.Mock).mockResolvedValue([mockCharacter]);

      const result = await CharacterService.searchCharacters(filters);

      expect(characterRepository.findWithFilters).toHaveBeenCalledWith(filters);
      expect(cacheService.setCharactersByFilters).toHaveBeenCalledWith(filters, [mockCharacter]);
      expect(result).toEqual([mockCharacter]);
    });

    it('should return empty array when no matches found', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findWithFilters as jest.Mock).mockResolvedValue([]);

      const result = await CharacterService.searchCharacters({ name: 'Nonexistent' });

      expect(result).toEqual([]);
    });
  });

  describe('createCharacter', () => {
    it('should create a new character via repository', async () => {
      const newCharacterData = {
        name: 'Summer Smith',
        status: 'Alive',
        species: 'Human',
        gender: 'Female',
        origin: 'Earth (C-137)',
      };
      const createdCharacter = { id: 3, ...newCharacterData };
      (characterRepository.create as jest.Mock).mockResolvedValue(createdCharacter);

      const result = await CharacterService.createCharacter(newCharacterData);

      expect(characterRepository.create).toHaveBeenCalledWith(newCharacterData);
      expect(result).toEqual(createdCharacter);
    });
  });

  describe('updateCharacter', () => {
    it('should update an existing character', async () => {
      const updateData = { status: 'Dead' };
      const updatedCharacter = { ...mockCharacter, status: 'Dead' };
      (characterRepository.findById as jest.Mock).mockResolvedValue(mockCharacter);
      (characterRepository.update as jest.Mock).mockResolvedValue([1, [updatedCharacter]]);

      const result = await CharacterService.updateCharacter(1, updateData);

      expect(characterRepository.findById).toHaveBeenCalledWith(1);
      expect(characterRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedCharacter);
    });

    it('should throw error when character not found', async () => {
      (characterRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CharacterService.updateCharacter(999, { status: 'Dead' })).rejects.toThrow(
        'Character with ID 999 not found'
      );
      expect(characterRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCharacter', () => {
    it('should delete an existing character', async () => {
      (characterRepository.findById as jest.Mock).mockResolvedValue(mockCharacter);
      (characterRepository.delete as jest.Mock).mockResolvedValue(1);

      const result = await CharacterService.deleteCharacter(1);

      expect(characterRepository.findById).toHaveBeenCalledWith(1);
      expect(characterRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw error when character not found', async () => {
      (characterRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CharacterService.deleteCharacter(999)).rejects.toThrow(
        'Character with ID 999 not found'
      );
      expect(characterRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('syncCharacters', () => {
    it('should sync characters and invalidate cache', async () => {
      const charactersToSync = [
        { name: 'Rick', status: 'Alive' },
        { name: 'Morty', status: 'Alive' },
      ];
      (characterRepository.bulkCreateOrUpdate as jest.Mock).mockResolvedValue(mockCharacters);
      (cacheService.invalidateAll as jest.Mock).mockResolvedValue(undefined);

      const result = await CharacterService.syncCharacters(charactersToSync);

      expect(characterRepository.bulkCreateOrUpdate).toHaveBeenCalledWith(charactersToSync);
      expect(cacheService.invalidateAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCharacters);
    });

    it('should handle empty array', async () => {
      (characterRepository.bulkCreateOrUpdate as jest.Mock).mockResolvedValue([]);
      (cacheService.invalidateAll as jest.Mock).mockResolvedValue(undefined);

      const result = await CharacterService.syncCharacters([]);

      expect(characterRepository.bulkCreateOrUpdate).toHaveBeenCalledWith([]);
      expect(cacheService.invalidateAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('getCharacterCount', () => {
    it('should return character count from repository', async () => {
      (characterRepository.count as jest.Mock).mockResolvedValue(100);

      const result = await CharacterService.getCharacterCount();

      expect(characterRepository.count).toHaveBeenCalledTimes(1);
      expect(result).toBe(100);
    });

    it('should return 0 when no characters exist', async () => {
      (characterRepository.count as jest.Mock).mockResolvedValue(0);

      const result = await CharacterService.getCharacterCount();

      expect(result).toBe(0);
    });
  });

  describe('Cache Integration', () => {
    it('should demonstrate cache-first strategy for getAllCharacters', async () => {
      // Primera llamada - cache miss
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValueOnce(null);
      (characterRepository.findAll as jest.Mock).mockResolvedValue(mockCharacters);

      await CharacterService.getAllCharacters();

      expect(characterRepository.findAll).toHaveBeenCalledTimes(1);
      expect(cacheService.setCharactersByFilters).toHaveBeenCalledTimes(1);

      // Limpiar mocks para simular segunda llamada
      jest.clearAllMocks();

      // Segunda llamada - cache hit
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(mockCharacters);

      await CharacterService.getAllCharacters();

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({});
      expect(characterRepository.findAll).not.toHaveBeenCalled(); // No debe llamar al repo
    });

    it('should demonstrate cache-first strategy for getCharacterById', async () => {
      // Primera llamada - cache miss
      (cacheService.getCharacterById as jest.Mock).mockResolvedValueOnce(null);
      (characterRepository.findById as jest.Mock).mockResolvedValue(mockCharacter);

      await CharacterService.getCharacterById(1);

      expect(characterRepository.findById).toHaveBeenCalledTimes(1);
      expect(cacheService.setCharacterById).toHaveBeenCalledWith(1, mockCharacter);

      // Limpiar mocks para simular segunda llamada
      jest.clearAllMocks();

      // Segunda llamada - cache hit
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(mockCharacter);

      await CharacterService.getCharacterById(1);

      expect(cacheService.getCharacterById).toHaveBeenCalledWith(1);
      expect(characterRepository.findById).not.toHaveBeenCalled(); // No debe llamar al repo
    });
  });
});
