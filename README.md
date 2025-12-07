# 🚀 Rick & Morty Characters API

API GraphQL para buscar personajes de Rick & Morty con caché en Redis y base de datos PostgreSQL.

## 📋 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [API GraphQL](#-api-graphql)
- [Tests](#-tests)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tipos TypeScript](#-tipos-typescript)

## 🛠 Tecnologías

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Node.js | 18+ | Runtime de JavaScript |
| TypeScript | 5.9.3 | Tipado estático |
| Express | 5.2.1 | Framework web |
| Apollo Server | 4.12.2 | Servidor GraphQL |
| Sequelize | 6.37.7 | ORM para PostgreSQL |
| PostgreSQL | 14+ | Base de datos (Supabase) |
| Redis (ioredis) | 5.8.2 | Cliente Redis para Node.js |
| Jest | 30.2.0 | Framework de testing |
| node-cron | 4.2.1 | Scheduler para cron jobs |
| Swagger UI | 5.0.1 | Documentación API REST |

## 🏗 Arquitectura

El proyecto sigue una arquitectura en capas:

```
┌─────────────────────────────────────────────┐
│              GraphQL (Apollo)               │
├─────────────────────────────────────────────┤
│                 Services                     │
│         (Lógica de negocio + Caché)         │
├─────────────────────────────────────────────┤
│               Repositories                   │
│            (Acceso a datos)                  │
├──────────────────────┬──────────────────────┤
│     PostgreSQL       │        Redis         │
│    (Persistencia)    │       (Caché)        │
└──────────────────────┴──────────────────────┘
```

### Patrones Implementados

- **Repository Pattern**: Abstracción de acceso a datos
- **Service Layer**: Lógica de negocio centralizada
- **Decorator Pattern**: `@ExecutionTime` para medir rendimiento
- **Singleton**: Instancias únicas de servicios y conexiones

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **Docker** (para Redis local)
- **Git**

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/ddpeream/test-backend-blossom.git
cd test-backend-blossom
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

   Nota: el archivo `.env` con las credenciales ya fue enviado al evaluador junto con el test; si lo necesitas solo colocalo en la raiz del proyecto.

4. **Iniciar Redis con Docker**
```bash
docker run -d --name redis-blossom -p 6379:6379 redis:alpine
```

5. **Poblar la base de datos**
```bash
npm run seed
```

## ⚙️ Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
# Server
NODE_ENV=development
PORT=4000

# PostgreSQL (Supabase)
POSTGRES_HOST=your-host.supabase.com
POSTGRES_PORT=6543
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cron Job (opcional)
ENABLE_CRON=true
```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:4000`

### Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Servidor con hot-reload (tsx watch) |
| `build` | `npm run build` | Compilar TypeScript a JavaScript |
| `start` | `npm start` | Ejecutar build de producción |
| `test` | `npm test` | Ejecutar todos los tests (169) |
| `test:integration` | `npm run test:integration` | Tests de integración (50) |
| `test:all` | `npm run test:all` | Todos los tests (169) |
| `seed` | `npm run seed` | Poblar BD con datos iniciales |
| `migrate` | `npm run migrate` | Ejecutar migraciones |
| `migrate:undo` | `npm run migrate:undo` | Revertir última migración |

### Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Health check del servidor |
| `GET /api-docs` | Documentación Swagger UI |
| `POST /graphql` | API GraphQL |
| `GET /graphql` | Apollo Playground |

## 📊 API GraphQL

### Playground

Accede a `http://localhost:4000/graphql` para el playground de Apollo.

## 📖 Swagger Documentation

Accede a **`http://localhost:4000/api-docs`** para ver la documentación interactiva Swagger UI.

### ¿Qué encontrarás en Swagger?

| Sección | Descripción |
|---------|-------------|
| **Info** | Información general de la API, versión y contacto |
| **Health** | Endpoint `/health` para verificar estado del servidor |
| **GraphQL** | Documentación del endpoint `/graphql` con ejemplos |
| **Schemas** | Modelos de datos (Character, HealthResponse, etc.) |

### Características de la Documentación

- ✅ **Ejemplos interactivos**: Prueba los endpoints directamente desde Swagger
- ✅ **Queries GraphQL**: Ejemplos de todas las queries disponibles
- ✅ **Mutations**: Documentación de syncCharacters
- ✅ **Modelos**: Schema completo del modelo Character
- ✅ **Filtros**: Documentación de todos los filtros de búsqueda

### Queries Disponibles

#### Obtener todos los personajes (con paginación)
```graphql
query {
  characters(pagination: { page: 1, limit: 10 }) {
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
```

#### Obtener personaje por ID
```graphql
query {
  character(id: 1) {
    id
    name
    status
    species
  }
}
```

#### Buscar con filtros y paginación
```graphql
query {
  searchCharacters(
    filters: {
      name: "Rick"
      status: "Alive"
      species: "Human"
      gender: "Male"
    }
    pagination: { page: 1, limit: 10 }
  ) {
    data {
      id
      name
      status
      origin
    }
    total
    page
    limit
    totalPages
  }
}
```

#### Contar personajes
```graphql
query {
  characterCount
}
```

### Mutations

#### Sincronizar personajes desde API externa
```graphql
mutation {
  syncCharacters {
    success
    message
    count
  }
}
```

### Filtros Disponibles

| Filtro | Tipo | Descripción |
|--------|------|-------------|
| `name` | String | Búsqueda parcial por nombre |
| `status` | String | Alive, Dead, unknown |
| `species` | String | Human, Alien, etc. |
| `gender` | String | Male, Female, Genderless, unknown |
| `origin` | String | Planeta/dimensión de origen |

## 🧪 Tests

El proyecto cuenta con **169 tests** divididos en unitarios e integración.

### Ejecutar Tests

```bash
# Tests unitarios (119 tests)
npm test

# Tests de integración (44 tests) - requiere PostgreSQL y Redis
npm run test:integration

# Todos los tests (163 tests)
npm run test:all

# Modo watch (desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage
```

### Resumen de Tests

### Tests Unitarios (119 tests)

| Suite | Tests | Descripción |
|-------|-------|-------------|
| Character Repository | 21 | CRUD completo, filtros, búsqueda |
| Character Service | 21 | Lógica de negocio, integración cache |
| GraphQL Resolvers | 17 | Queries y mutations |
| Sync Characters Job | 16 | Cron job lifecycle |
| Logging Middleware | 24 | HTTP methods, status codes |
| Cache Service | 11 | Operaciones Redis |
| ExecutionTime Decorator | 5 | Medición de rendimiento |
| Rick & Morty API Client | 4 | Integración API externa |

### Tests de Integración (44 tests)

| Suite | Tests | Descripción |
|-------|-------|-------------|
| Database Integration | 12 | PostgreSQL real, CRUD, transacciones |
| Redis Integration | 17 | Cache real, TTL, invalidación |
| GraphQL Integration | 15 | Apollo Server + Express stack completo |

## 📁 Estructura del Proyecto

```
src/
├── app.ts                    # Punto de entrada principal
├── config/
│   ├── database.ts           # Conexión PostgreSQL
│   ├── redis.ts              # Conexión Redis
│   └── sequelize.config.js   # Config para CLI Sequelize
├── types/
│   ├── character.types.ts    # Tipos e interfaces TypeScript
│   └── index.ts              # Barrel export
├── models/
│   └── Character.ts          # Modelo Sequelize
├── repositories/
│   ├── character.repository.ts
│   └── character.repository.test.ts
├── services/
│   ├── character.service.ts
│   ├── character.service.test.ts
│   ├── rickMortyApi.client.ts
│   └── rickMortyApi.client.test.ts
├── cache/
│   ├── cache.service.ts      # Servicio de caché Redis
│   └── cache.service.test.ts
├── graphql/
│   ├── index.ts              # Apollo Server setup
│   ├── resolvers/
│   │   ├── resolvers.ts      # Query & Mutation resolvers
│   │   └── resolvers.test.ts
│   └── schemas/
│       └── schema.ts         # Type definitions GraphQL
├── decorators/
│   ├── executionTime.decorator.ts
│   └── executionTime.decorator.test.ts
├── jobs/
│   ├── syncCharacters.job.ts # Cron cada 12h
│   └── syncCharacters.job.test.ts
├── middlewares/
│   ├── logging.middleware.ts
│   └── logging.middleware.test.ts
├── database/
│   └── migrations/           # Migraciones Sequelize
├── docs/
│   ├── swagger.json          # OpenAPI 3.0 specification
│   └── ERD.md                # Diagrama entidad-relación
├── scripts/
│   └── seed.ts               # Seeder inicial programático
└── tests/
    └── integration/          # Tests de integración
        ├── database.integration.test.ts
        ├── redis.integration.test.ts
        └── graphql.integration.test.ts
```

## 🔄 Cron Job

El sistema incluye un cron job que sincroniza personajes cada 12 horas:

- **Expresión**: `0 */12 * * *` (00:00 y 12:00)
- **Función**: Obtiene 15 personajes de la API e invalida caché
- **Control**: Variable `ENABLE_CRON` en `.env`

## 📈 Rendimiento

### Sistema de Caché

- **TTL**: 5 minutos (300 segundos)
- **Estrategia**: Cache-aside con invalidación en sync
- **Mejora**: ~100x más rápido en cache hits

Ejemplo de logs:
```
📭 Cache MISS: characters:all
💾 Cache SET: characters:all (TTL: 300s)
[POST /graphql] - 200 - 565ms

📦 Cache HIT: characters:all
[POST /graphql] - 200 - 5ms
```

### Decorator de Timing

Los métodos del servicio están decorados con `@ExecutionTime`:
```
⏱️  [CharacterService.getAllCharacters] executed in 5.23ms
```

## 🗄️ Base de Datos

### Modelo Character

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | PK, auto-increment |
| name | STRING | Nombre del personaje |
| status | STRING | Alive, Dead, unknown |
| species | STRING | Especie |
| type | STRING | Subtipo (opcional) |
| gender | STRING | Género |
| origin | STRING | Origen |
| image | STRING | URL de imagen |
| createdAt | DATE | Fecha creación |
| updatedAt | DATE | Fecha actualización |

## 📐 Tipos TypeScript

El proyecto utiliza tipos e interfaces centralizados en `src/types/` para garantizar type-safety en toda la aplicación.

### Tipos Principales

```typescript
// Atributos base de un personaje
interface CharacterAttributes {
  id: number;
  name: string;
  status: string;
  species: string;
  type?: string;
  gender: string;
  origin: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Filtros de búsqueda
interface CharacterFilters {
  name?: string;
  status?: string;
  species?: string;
  gender?: string;
  origin?: string;
}

// Input de paginación (GraphQL)
interface PaginationInput {
  page?: number;
  limit?: number;
}

// Respuesta paginada
interface PaginatedCharacterResponse {
  data: PlainCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Tipos GraphQL

```graphql
# Tipo Character
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

# Input para filtros
input CharacterFilterInput {
  name: String
  status: String
  species: String
  gender: String
  origin: String
}

# Input para paginación
input PaginationInput {
  page: Int
  limit: Int
}

# Respuesta paginada
type PaginatedCharacters {
  data: [Character!]!
  total: Int!
  page: Int!
  limit: Int!
  totalPages: Int!
}
```

### Ubicación de Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/types/character.types.ts` | Todos los tipos de Character |
| `src/types/index.ts` | Barrel export de tipos |
| `src/graphql/schemas/schema.ts` | Definiciones GraphQL |

## 👤 Autor

**Deimar Perea Moreno** - [GitHub](https://github.com/ddpeream)

## 📄 Licencia

ISC
