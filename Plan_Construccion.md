# Orden de Construcción del Proyecto

## Fase 1: Setup Inicial
- [x] 1. Inicializar proyecto (package.json, tsconfig, estructura de carpetas)
- [x] 2. Instalar dependencias
- [x] 3. Configurar variables de entorno (.env con credenciales de Supabase y Redis local)

## Fase 2: Base de Datos
- [x] 4. Configurar conexión a Supabase (PostgreSQL) con Sequelize
- [x] 5. Crear modelo de Character
- [x] 6. Crear migración
- [x] 7. Crear seeder (15 personajes)

## Fase 3: Servidor Base
- [x] 8. Express básico funcionando (health check)
- [x] 9. Middleware de logging

## Fase 4: Capa de Datos
- [x] 10. Repository de Characters
- [x] 11. Service de Characters

## Fase 5: GraphQL
- [x] 12. Schema de GraphQL
- [x] 13. Resolvers
- [x] 14. Integrar Apollo Server con Express

## Fase 6: API Externa
- [x] 15. Cliente para consumir API de Rick & Morty
- [x] 16. Conectar con el seeder para poblar BD

## Fase 7: Redis/Caché
- [x] 17. Conexión a Redis (local)
- [x] 18. Integrar caché en las búsquedas

## Fase 8: Opcionales
- [x] 19. Decorador de tiempo de ejecución
- [x] 20. Cron job (sincronización cada 12h)
- [x] 21. Tests unitarios

## Fase 9: Documentación
- [x] 22. README con instrucciones
- [x] 23. Diagrama ERD
- [x] 24. Swagger (opcional)
