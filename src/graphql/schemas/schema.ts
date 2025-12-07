import gql from 'graphql-tag';

/**
 * Schema de GraphQL para la API de Rick & Morty
 * Define los tipos, queries y mutations disponibles
 */
export const typeDefs = gql`
  # Tipo Character - Representa un personaje de Rick & Morty
  type Character {
    id: Int!
    name: String!
    status: String!
    species: String!
    type: String
    gender: String!
    origin: String
    image: String
    createdAt: String
    updatedAt: String
  }

  # Input para filtrar personajes
  input CharacterFilterInput {
    name: String
    status: String
    species: String
    gender: String
    origin: String
  }

  # Queries disponibles
  type Query {
    # Obtener todos los personajes
    characters: [Character!]!
    
    # Obtener un personaje por ID
    character(id: Int!): Character
    
    # Buscar personajes con filtros
    searchCharacters(filters: CharacterFilterInput): [Character!]!
    
    # Obtener el conteo total de personajes
    characterCount: Int!
  }

  # Mutations disponibles (opcional, para operaciones de escritura)
  type Mutation {
    # Sincronizar personajes desde la API externa
    syncCharacters: SyncResult!
  }

  # Resultado de sincronización
  type SyncResult {
    success: Boolean!
    message: String!
    count: Int
  }
`;
