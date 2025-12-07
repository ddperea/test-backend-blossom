# Estructura del Proyecto

```
src/
├── app.ts                              # Punto de entrada principal
├── config/
│   ├── database.ts                     # Conexión PostgreSQL (Supabase)
│   ├── redis.ts                        # Conexión Redis
│   └── sequelize.config.js             # Configuración CLI Sequelize
├── models/
│   └── Character.ts                    # Modelo Sequelize
├── repositories/
│   ├── character.repository.ts         # Patrón Repository
│   └── character.repository.test.ts    # 21 tests unitarios
├── services/
│   ├── character.service.ts            # Lógica de negocio + caché
│   ├── character.service.test.ts       # 21 tests unitarios
│   ├── rickMortyApi.client.ts          # Cliente API externa
│   └── rickMortyApi.client.test.ts     # 4 tests unitarios
├── graphql/
│   ├── index.ts                        # Apollo Server setup
│   ├── resolvers/
│   │   ├── resolvers.ts                # Query & Mutation resolvers
│   │   └── resolvers.test.ts           # 17 tests unitarios
│   └── schemas/
│       └── schema.ts                   # Type definitions GraphQL
├── cache/
│   ├── cache.service.ts                # Servicio de caché Redis
│   └── cache.service.test.ts           # 11 tests unitarios
├── decorators/
│   ├── executionTime.decorator.ts      # Decorator para medir tiempo
│   └── executionTime.decorator.test.ts # 5 tests unitarios
├── jobs/
│   ├── syncCharacters.job.ts           # Cron job cada 12h
│   └── syncCharacters.job.test.ts      # 16 tests unitarios
├── middlewares/
│   ├── logging.middleware.ts           # Middleware de logging HTTP
│   └── logging.middleware.test.ts      # 24 tests unitarios
├── database/
│   └── migrations/
│       └── 20251205134703-create-characters-table.js
├── docs/
│   ├── swagger.json                    # OpenAPI 3.0 specification
│   └── ERD.md                          # Diagrama entidad-relación
├── scripts/
│   └── seed.ts                         # Seeder programático
└── tests/
    └── integration/
        ├── database.integration.test.ts  # 12 tests integración
        ├── redis.integration.test.ts     # 17 tests integración
        └── graphql.integration.test.ts   # 15 tests integración
```

## Resumen de Tests

| Tipo | Cantidad |
|------|----------|
| Tests Unitarios | 119 |
| Tests de Integración | 44 |
| **Total** | **163** |

---

## Librerías

### Obligatorias
- express
- graphql
- @apollo/server
- sequelize
- pg / pg-hstore (PostgreSQL)
- ioredis
- graphql-request

### Opcionales (Funcionalidades extra)
- node-cron
- jest / ts-jest
- swagger-ui-express / swagger-jsdoc

### TypeScript
- typescript
- tsx
- @types/express
- @types/node

### Desarrollo
- dotenv
- sequelize-cli
- supertest

---

### Versiones Instaladas

#### Dependencias de Producción
| Librería | Versión |
|----------|---------|
| express | 5.2.1 |
| @apollo/server | 4.12.2 |
| graphql | 16.11.0 |
| sequelize | 6.37.7 |
| pg | 8.16.0 |
| pg-hstore | 2.3.4 |
| ioredis | 5.8.2 |
| graphql-request | 7.2.0 |
| node-cron | 4.2.1 |
| swagger-ui-express | 5.0.1 |
| swagger-jsdoc | 6.2.8 |
| dotenv | 16.5.0 |
| cors | 2.8.5 |

#### Dependencias de Desarrollo
| Librería | Versión |
|----------|---------|
| typescript | 5.9.3 |
| tsx | 4.20.3 |
| jest | 30.2.0 |
| ts-jest | 29.4.6 |
| supertest | 7.1.4 |
| sequelize-cli | 6.6.2 |

---

## Recursos Externos

| Recurso | Ubicación | Descripción |
|---------|-----------|-------------|
| PostgreSQL | Supabase (nube) | Base de datos principal |
| Redis | Docker local | Sistema de caché |
| API Rick & Morty | rickandmortyapi.com | Fuente de datos |
