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

/**
 * Helper para crear un mock de modelo Sequelize con toJSON()
 * Simula el comportamiento real de un modelo Sequelize
 */
const createMockSequelizeModel = <T extends Record<string, unknown>>(data: T) => ({
  ...data,
  toJSON: () => data,
  dataValues: data,
});

describe('CharacterService', () => {
  // Mock de datos de personajes (objetos planos para comparaciones)
  const mockCharacterData = {
    id: 1,
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: 'Earth (C-137)',
    image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  };

  const mockCharacterData2 = {
    id: 2,
    name: 'Morty Smith',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: 'Earth (C-137)',
    image: 'https://rickandmortyapi.com/api/character/avatar/2.jpeg',
  };

  // Mocks de modelos Sequelize (con toJSON)
  const mockCharacter = createMockSequelizeModel(mockCharacterData);
  const mockCharacters = [
    createMockSequelizeModel(mockCharacterData),
    createMockSequelizeModel(mockCharacterData2),
  ];

  // Datos planos para cache (lo que retorna el service)
  const mockCharactersPlain = [mockCharacterData, mockCharacterData2];
  
  // Respuesta paginada esperada
  const mockPaginatedResponse = {
    data: mockCharactersPlain,
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCharacters', () => {
    it('should return paginated characters from cache when available', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(mockPaginatedResponse);

      const result = await CharacterService.getAllCharacters();

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({ _page: 1, _limit: 20 });
      expect(characterRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findAll as jest.Mock).mockResolvedValue({
        rows: mockCharacters,
        count: 2,
      });

      const result = await CharacterService.getAllCharacters();

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({ _page: 1, _limit: 20 });
      expect(characterRepository.findAll).toHaveBeenCalledWith({ offset: 0, limit: 20 });
      expect(cacheService.setCharactersByFilters).toHaveBeenCalled();
      expect(result.data).toEqual(mockCharactersPlain);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should return empty data when no characters in database', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      });

      const result = await CharacterService.getAllCharacters();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should apply pagination parameters', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacters[0]],
        count: 2,
      });

      const result = await CharacterService.getAllCharacters({ page: 2, limit: 1 });

      expect(characterRepository.findAll).toHaveBeenCalledWith({ offset: 1, limit: 1 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('getCharacterById', () => {
    it('should return character from cache when available', async () => {
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(mockCharacterData);

      const result = await CharacterService.getCharacterById(1);

      expect(cacheService.getCharacterById).toHaveBeenCalledWith(1);
      expect(characterRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockCharacterData);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(null);
      (characterRepository.findById as jest.Mock).mockResolvedValue(mockCharacter);

      const result = await CharacterService.getCharacterById(1);

      expect(cacheService.getCharacterById).toHaveBeenCalledWith(1);
      expect(characterRepository.findById).toHaveBeenCalledWith(1);
      expect(cacheService.setCharacterById).toHaveBeenCalledWith(1, mockCharacterData);
      expect(result).toEqual(mockCharacterData);
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
    
    const mockFilteredPaginatedResponse = {
      data: [mockCharacterData],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should return paginated characters from cache when available', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(mockFilteredPaginatedResponse);

      const result = await CharacterService.searchCharacters(filters);

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({ ...filters, _page: 1, _limit: 20 });
      expect(characterRepository.findWithFilters).not.toHaveBeenCalled();
      expect(result).toEqual(mockFilteredPaginatedResponse);
    });

    it('should fetch from repository and cache when cache miss', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findWithFilters as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const result = await CharacterService.searchCharacters(filters);

      expect(characterRepository.findWithFilters).toHaveBeenCalledWith(filters, { offset: 0, limit: 20 });
      expect(cacheService.setCharactersByFilters).toHaveBeenCalled();
      expect(result.data).toEqual([mockCharacterData]);
      expect(result.total).toBe(1);
    });

    it('should return empty result when no matches found', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findWithFilters as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      });

      const result = await CharacterService.searchCharacters({ name: 'Nonexistent' });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should apply pagination with filters', async () => {
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(null);
      (characterRepository.findWithFilters as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 5,
      });

      const result = await CharacterService.searchCharacters(filters, { page: 2, limit: 1 });

      expect(characterRepository.findWithFilters).toHaveBeenCalledWith(filters, { offset: 1, limit: 1 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(5);
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
      (characterRepository.findAll as jest.Mock).mockResolvedValue({
        rows: mockCharacters,
        count: 2,
      });

      await CharacterService.getAllCharacters();

      expect(characterRepository.findAll).toHaveBeenCalledTimes(1);
      expect(cacheService.setCharactersByFilters).toHaveBeenCalledTimes(1);

      // Limpiar mocks para simular segunda llamada
      jest.clearAllMocks();

      // Segunda llamada - cache hit
      (cacheService.getCharactersByFilters as jest.Mock).mockResolvedValue(mockPaginatedResponse);

      await CharacterService.getAllCharacters();

      expect(cacheService.getCharactersByFilters).toHaveBeenCalledWith({ _page: 1, _limit: 20 });
      expect(characterRepository.findAll).not.toHaveBeenCalled(); // No debe llamar al repo
    });

    it('should demonstrate cache-first strategy for getCharacterById', async () => {
      // Primera llamada - cache miss
      (cacheService.getCharacterById as jest.Mock).mockResolvedValueOnce(null);
      (characterRepository.findById as jest.Mock).mockResolvedValue(mockCharacter);

      await CharacterService.getCharacterById(1);

      expect(characterRepository.findById).toHaveBeenCalledTimes(1);
      expect(cacheService.setCharacterById).toHaveBeenCalledWith(1, mockCharacterData);

      // Limpiar mocks para simular segunda llamada
      jest.clearAllMocks();

      // Segunda llamada - cache hit
      (cacheService.getCharacterById as jest.Mock).mockResolvedValue(mockCharacterData);

      await CharacterService.getCharacterById(1);

      expect(cacheService.getCharacterById).toHaveBeenCalledWith(1);
      expect(characterRepository.findById).not.toHaveBeenCalled(); // No debe llamar al repo
    });
  });
});
