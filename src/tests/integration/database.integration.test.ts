import sequelize, { testConnection } from '../../config/database';
import Character from '../../models/Character';

/**
 * Tests de Integración - Base de Datos
 * 
 * Estos tests se conectan a la base de datos REAL (Supabase)
 * para verificar que las operaciones CRUD funcionan correctamente.
 */
describe('Database Integration Tests', () => {
  // ID único para pruebas (usamos un número alto para no colisionar)
  const testCharacterId = 99999;
  
  // Datos de prueba
  const testCharacter = {
    id: testCharacterId,
    name: 'Test Integration Character',
    status: 'Alive',
    species: 'Human',
    type: 'Test Type',
    gender: 'Male',
    origin: 'Test Origin',
    image: 'https://test.com/image.png',
  };

  let createdCharacterId: number = 0;

  beforeAll(async () => {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Database connection established for integration tests');
  });

  afterAll(async () => {
    // Limpiar datos de prueba y cerrar conexión
    if (createdCharacterId) {
      await Character.destroy({ where: { id: createdCharacterId } });
      console.log(`🧹 Cleaned up test character ID: ${createdCharacterId}`);
    }
    await sequelize.close();
    console.log('🔌 Database connection closed');
  });

  describe('Connection', () => {
    it('should connect to the database successfully', async () => {
      const result = await sequelize.authenticate();
      expect(result).toBeUndefined(); // authenticate() no devuelve nada si es exitoso
    });

    it('should have access to Character model', () => {
      expect(Character).toBeDefined();
      expect(Character.tableName.toLowerCase()).toBe('characters');
    });
  });

  describe('Character CRUD Operations', () => {
    it('should CREATE a new character', async () => {
      const character = await Character.create(testCharacter);
      createdCharacterId = character.id;

      expect(character).toBeDefined();
      expect(character.id).toBeDefined();
      expect(character.name).toBe(testCharacter.name);
      expect(character.status).toBe(testCharacter.status);
      expect(character.species).toBe(testCharacter.species);
      expect(character.gender).toBe(testCharacter.gender);
      expect(character.origin).toBe(testCharacter.origin);
    });

    it('should READ the created character by ID', async () => {
      const character = await Character.findByPk(createdCharacterId);

      expect(character).not.toBeNull();
      expect(character?.id).toBe(createdCharacterId);
      expect(character?.name).toBe(testCharacter.name);
    });

    it('should READ all characters', async () => {
      const characters = await Character.findAll();

      expect(Array.isArray(characters)).toBe(true);
      expect(characters.length).toBeGreaterThan(0);
      
      // Verificar que nuestro personaje de prueba está incluido
      const testChar = characters.find(c => c.id === createdCharacterId);
      expect(testChar).toBeDefined();
    });

    it('should UPDATE the character', async () => {
      const newName = 'Updated Integration Character';
      
      await Character.update(
        { name: newName },
        { where: { id: createdCharacterId } }
      );

      const updatedCharacter = await Character.findByPk(createdCharacterId);
      
      expect(updatedCharacter?.name).toBe(newName);
    });

    it('should SEARCH characters with filters', async () => {
      // Buscar por nombre parcial
      const characters = await Character.findAll({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          'LIKE',
          '%integration%'
        ),
      });

      expect(characters.length).toBeGreaterThanOrEqual(1);
    });

    it('should COUNT total characters', async () => {
      const count = await Character.count();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should DELETE the character', async () => {
      const deletedCount = await Character.destroy({
        where: { id: createdCharacterId },
      });

      expect(deletedCount).toBe(1);

      // Verificar que ya no existe
      const character = await Character.findByPk(createdCharacterId);
      expect(character).toBeNull();

      // Marcar como eliminado para que afterAll no intente eliminarlo de nuevo
      createdCharacterId = 0;
    });
  });

  describe('Data Integrity', () => {
    it('should have characters from seed (at least 15)', async () => {
      const count = await Character.count();
      
      // El seed inicial debe tener al menos 15 personajes
      expect(count).toBeGreaterThanOrEqual(15);
    });

    it('should have Rick Sanchez in the database', async () => {
      const rick = await Character.findOne({
        where: { name: 'Rick Sanchez' },
      });

      expect(rick).not.toBeNull();
      expect(rick?.status).toBe('Alive');
      expect(rick?.species).toBe('Human');
    });

    it('should have valid data structure for all characters', async () => {
      const characters = await Character.findAll({ limit: 5 });

      characters.forEach(character => {
        expect(character.id).toBeDefined();
        expect(character.name).toBeDefined();
        expect(character.status).toBeDefined();
        expect(character.species).toBeDefined();
        expect(character.gender).toBeDefined();
        expect(character.origin).toBeDefined();
        expect(character.createdAt).toBeDefined();
        expect(character.updatedAt).toBeDefined();
      });
    });
  });
});
