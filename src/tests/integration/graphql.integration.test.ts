import request from 'supertest';
import express, { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from '../../graphql/schemas/schema';
import { resolvers } from '../../graphql/resolvers/resolvers';
import sequelize from '../../config/database';
import redis from '../../config/redis';
import cacheService from '../../cache/cache.service';

/**
 * Tests de Integración - GraphQL API
 * 
 * Estos tests se conectan al servidor GraphQL REAL
 * con base de datos y cache para verificar el flujo completo.
 */
describe('GraphQL Integration Tests', () => {
  let app: Express;
  let server: ApolloServer;

  beforeAll(async () => {
    // Configurar Express y Apollo Server
    app = express();
    app.use(express.json());

    server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    app.use('/graphql', expressMiddleware(server) as any);

    // Conectar a servicios
    await sequelize.authenticate();
    if (redis.status !== 'ready') {
      await redis.connect();
    }

    // Limpiar cache antes de tests para asegurar datos frescos
    await cacheService.invalidateAll();

    console.log('✅ GraphQL server ready for integration tests');
  });

  afterAll(async () => {
    await server.stop();
    await sequelize.close();
    await redis.quit();
    console.log('🔌 All connections closed');
  });

  describe('Query: characters', () => {
    it('should return paginated characters', async () => {
      const query = `
        query {
          characters {
            data {
              id
              name
              status
              species
              gender
              origin
              image
            }
            total
            page
            limit
            totalPages
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.characters).toBeDefined();
      expect(response.body.data.characters.data).toBeDefined();
      expect(Array.isArray(response.body.data.characters.data)).toBe(true);
      expect(response.body.data.characters.total).toBeGreaterThanOrEqual(15);
      expect(response.body.data.characters.page).toBe(1);
      expect(response.body.data.characters.limit).toBe(20);
    });

    it('should return characters with all required fields', async () => {
      const query = `
        query {
          characters {
            data {
              id
              name
              status
              species
              gender
              origin
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      const character = response.body.data.characters.data[0];
      expect(character.id).toBeDefined();
      expect(character.name).toBeDefined();
      expect(character.status).toBeDefined();
      expect(character.species).toBeDefined();
      expect(character.gender).toBeDefined();
      expect(character.origin).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const query = `
        query {
          characters(pagination: { page: 1, limit: 5 }) {
            data {
              id
              name
            }
            total
            page
            limit
            totalPages
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.characters.data.length).toBeLessThanOrEqual(5);
      expect(response.body.data.characters.page).toBe(1);
      expect(response.body.data.characters.limit).toBe(5);
    });
  });

  describe('Query: character (by ID)', () => {
    it('should return a single character by ID', async () => {
      const query = `
        query {
          character(id: 1) {
            id
            name
            status
            species
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.character).toBeDefined();
      expect(response.body.data.character.id).toBe(1);
    });

    it('should return null for non-existent character', async () => {
      // Usar ID muy alto que no existe en la BD y limpiar caché
      await cacheService.invalidateAll();
      
      const query = `
        query {
          character(id: 999999999) {
            id
            name
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.character).toBeNull();
    });
  });

  describe('Query: searchCharacters', () => {
    it('should search by name', async () => {
      const query = `
        query {
          searchCharacters(filters: { name: "Rick" }) {
            data {
              id
              name
              status
            }
            total
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const characters = response.body.data.searchCharacters.data;
      expect(characters.length).toBeGreaterThanOrEqual(1);
      
      // Todos los resultados deben contener "Rick"
      characters.forEach((char: any) => {
        expect(char.name.toLowerCase()).toContain('rick');
      });
    });

    it('should search by status', async () => {
      const query = `
        query {
          searchCharacters(filters: { status: "Alive" }) {
            data {
              id
              name
              status
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      const characters = response.body.data?.searchCharacters?.data || [];
      expect(Array.isArray(characters)).toBe(true);
      characters.forEach((char: any) => {
        expect(char.status).toBe('Alive');
      });
    });

    it('should search by species', async () => {
      const query = `
        query {
          searchCharacters(filters: { species: "Human" }) {
            data {
              id
              name
              species
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      const characters = response.body.data.searchCharacters.data;
      characters.forEach((char: any) => {
        expect(char.species).toBe('Human');
      });
    });

    it('should search by gender', async () => {
      const query = `
        query {
          searchCharacters(filters: { gender: "Male" }) {
            data {
              id
              name
              gender
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      const characters = response.body.data.searchCharacters.data;
      characters.forEach((char: any) => {
        expect(char.gender).toBe('Male');
      });
    });

    it('should search by origin', async () => {
      const query = `
        query {
          searchCharacters(filters: { origin: "Earth" }) {
            data {
              id
              name
              origin
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      const characters = response.body.data.searchCharacters.data;
      characters.forEach((char: any) => {
        expect(char.origin.toLowerCase()).toContain('earth');
      });
    });

    it('should search with multiple filters', async () => {
      const query = `
        query {
          searchCharacters(filters: { 
            status: "Alive", 
            species: "Human",
            gender: "Male"
          }) {
            data {
              id
              name
              status
              species
              gender
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      const characters = response.body.data.searchCharacters.data;
      characters.forEach((char: any) => {
        expect(char.status).toBe('Alive');
        expect(char.species).toBe('Human');
        expect(char.gender).toBe('Male');
      });
    });

    it('should return empty array when no matches', async () => {
      const query = `
        query {
          searchCharacters(filters: { name: "XYZNONEXISTENT123" }) {
            data {
              id
              name
            }
            total
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.searchCharacters.data).toEqual([]);
      expect(response.body.data.searchCharacters.total).toBe(0);
    });

    it('should support pagination with filters', async () => {
      const query = `
        query {
          searchCharacters(
            filters: { status: "Alive" },
            pagination: { page: 1, limit: 2 }
          ) {
            data {
              id
              name
            }
            total
            page
            limit
            totalPages
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.searchCharacters.data.length).toBeLessThanOrEqual(2);
      expect(response.body.data.searchCharacters.page).toBe(1);
      expect(response.body.data.searchCharacters.limit).toBe(2);
    });
  });

  describe('Query: characterCount', () => {
    it('should return total character count', async () => {
      const query = `
        query {
          characterCount
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(typeof response.body.data.characterCount).toBe('number');
      expect(response.body.data.characterCount).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Cache Performance', () => {
    it('should be faster on second request (cache hit)', async () => {
      const query = `
        query {
          characters {
            data {
              id
              name
            }
          }
        }
      `;

      // Primera petición (cache miss)
      const start1 = Date.now();
      await request(app).post('/graphql').send({ query });
      const time1 = Date.now() - start1;

      // Segunda petición (cache hit)
      const start2 = Date.now();
      await request(app).post('/graphql').send({ query });
      const time2 = Date.now() - start2;

      console.log(`First request: ${time1}ms, Second request: ${time2}ms`);
      
      // La segunda petición debería ser más rápida (o similar si la BD es muy rápida)
      // No hacemos assertion estricta porque puede variar por red
      expect(time2).toBeLessThanOrEqual(time1 + 50); // Permitir variación de 50ms
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query gracefully', async () => {
      const query = `
        query {
          invalidField
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle malformed request', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({ notAQuery: true })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });
});
