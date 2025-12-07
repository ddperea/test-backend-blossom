import { Op } from 'sequelize';
import CharacterRepository, { CharacterFilters } from './character.repository';
import Character from '../models/Character';

// Mock del modelo Character
jest.mock('../models/Character', () => ({
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  bulkCreate: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
}));

describe('CharacterRepository', () => {
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

  describe('findAll', () => {
    it('should return all characters from database with count', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockCharacters,
        count: 2,
      });

      const result = await CharacterRepository.findAll();

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
      expect(result.rows).toEqual(mockCharacters);
      expect(result.count).toBe(2);
    });

    it('should return empty result when no characters exist', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      });

      const result = await CharacterRepository.findAll();

      expect(result.rows).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should apply pagination options', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 2,
      });

      const result = await CharacterRepository.findAll({ offset: 0, limit: 1 });

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 1,
        order: [['id', 'ASC']],
      });
      expect(result.rows).toHaveLength(1);
      expect(result.count).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return character when found', async () => {
      (Character.findByPk as jest.Mock).mockResolvedValue(mockCharacter);

      const result = await CharacterRepository.findById(1);

      expect(Character.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCharacter);
    });

    it('should return null when character not found', async () => {
      (Character.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await CharacterRepository.findById(999);

      expect(Character.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('findWithFilters', () => {
    it('should filter by name with iLike (case-insensitive partial match)', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const filters: CharacterFilters = { name: 'Rick' };
      await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {
          name: { [Op.iLike]: '%Rick%' },
        },
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
    });

    it('should filter by status with exact match', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const filters: CharacterFilters = { status: 'Alive' };
      await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {
          status: 'Alive',
        },
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
    });

    it('should filter by species with exact match', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const filters: CharacterFilters = { species: 'Human' };
      await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {
          species: 'Human',
        },
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
    });

    it('should filter by gender with exact match', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const filters: CharacterFilters = { gender: 'Male' };
      await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {
          gender: 'Male',
        },
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
    });

    it('should filter by origin with iLike (case-insensitive partial match)', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const filters: CharacterFilters = { origin: 'Earth' };
      await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {
          origin: { [Op.iLike]: '%Earth%' },
        },
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
    });

    it('should apply multiple filters at once', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 1,
      });

      const filters: CharacterFilters = {
        name: 'Rick',
        status: 'Alive',
        species: 'Human',
        gender: 'Male',
        origin: 'Earth',
      };
      await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {
          name: { [Op.iLike]: '%Rick%' },
          status: 'Alive',
          species: 'Human',
          gender: 'Male',
          origin: { [Op.iLike]: '%Earth%' },
        },
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
    });

    it('should return empty result when no matches found', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [],
        count: 0,
      });

      const filters: CharacterFilters = { name: 'Nonexistent' };
      const result = await CharacterRepository.findWithFilters(filters);

      expect(result.rows).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should return all characters when no filters provided', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockCharacters,
        count: 2,
      });

      const filters: CharacterFilters = {};
      const result = await CharacterRepository.findWithFilters(filters);

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        offset: undefined,
        limit: undefined,
        order: [['id', 'ASC']],
      });
      expect(result.rows).toEqual(mockCharacters);
      expect(result.count).toBe(2);
    });

    it('should apply pagination with filters', async () => {
      (Character.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockCharacter],
        count: 5,
      });

      const filters: CharacterFilters = { status: 'Alive' };
      const result = await CharacterRepository.findWithFilters(filters, { offset: 0, limit: 1 });

      expect(Character.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'Alive' },
        offset: 0,
        limit: 1,
        order: [['id', 'ASC']],
      });
      expect(result.rows).toHaveLength(1);
      expect(result.count).toBe(5);
    });
  });

  describe('create', () => {
    it('should create a new character', async () => {
      const newCharacterData = {
        name: 'Summer Smith',
        status: 'Alive',
        species: 'Human',
        gender: 'Female',
        origin: 'Earth (C-137)',
      };
      const createdCharacter = { id: 3, ...newCharacterData };
      (Character.create as jest.Mock).mockResolvedValue(createdCharacter);

      const result = await CharacterRepository.create(newCharacterData);

      expect(Character.create).toHaveBeenCalledWith(newCharacterData);
      expect(result).toEqual(createdCharacter);
    });
  });

  describe('bulkCreateOrUpdate', () => {
    it('should create multiple characters with updateOnDuplicate', async () => {
      const charactersToCreate = [
        { name: 'Rick', status: 'Alive' },
        { name: 'Morty', status: 'Alive' },
      ];
      (Character.bulkCreate as jest.Mock).mockResolvedValue(mockCharacters);

      const result = await CharacterRepository.bulkCreateOrUpdate(charactersToCreate);

      expect(Character.bulkCreate).toHaveBeenCalledWith(charactersToCreate, {
        updateOnDuplicate: ['name', 'status', 'species', 'type', 'gender', 'origin', 'image', 'updatedAt'],
      });
      expect(result).toEqual(mockCharacters);
    });

    it('should handle empty array', async () => {
      (Character.bulkCreate as jest.Mock).mockResolvedValue([]);

      const result = await CharacterRepository.bulkCreateOrUpdate([]);

      expect(Character.bulkCreate).toHaveBeenCalledWith([], {
        updateOnDuplicate: ['name', 'status', 'species', 'type', 'gender', 'origin', 'image', 'updatedAt'],
      });
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update character and return affected rows', async () => {
      const updateData = { status: 'Dead' };
      const updatedCharacter = { ...mockCharacter, status: 'Dead' };
      (Character.update as jest.Mock).mockResolvedValue([1, [updatedCharacter]]);

      const result = await CharacterRepository.update(1, updateData);

      expect(Character.update).toHaveBeenCalledWith(updateData, {
        where: { id: 1 },
        returning: true,
      });
      expect(result).toEqual([1, [updatedCharacter]]);
    });

    it('should return 0 affected rows when character not found', async () => {
      const updateData = { status: 'Dead' };
      (Character.update as jest.Mock).mockResolvedValue([0, []]);

      const result = await CharacterRepository.update(999, updateData);

      expect(result).toEqual([0, []]);
    });
  });

  describe('delete', () => {
    it('should delete character and return deleted count', async () => {
      (Character.destroy as jest.Mock).mockResolvedValue(1);

      const result = await CharacterRepository.delete(1);

      expect(Character.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(1);
    });

    it('should return 0 when character not found', async () => {
      (Character.destroy as jest.Mock).mockResolvedValue(0);

      const result = await CharacterRepository.delete(999);

      expect(Character.destroy).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBe(0);
    });
  });

  describe('count', () => {
    it('should return total count of characters', async () => {
      (Character.count as jest.Mock).mockResolvedValue(100);

      const result = await CharacterRepository.count();

      expect(Character.count).toHaveBeenCalledTimes(1);
      expect(result).toBe(100);
    });

    it('should return 0 when no characters exist', async () => {
      (Character.count as jest.Mock).mockResolvedValue(0);

      const result = await CharacterRepository.count();

      expect(result).toBe(0);
    });
  });
});
