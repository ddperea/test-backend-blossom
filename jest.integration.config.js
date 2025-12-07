/**
 * Tests de Integración
 * 
 * Estos tests se conectan a servicios REALES (PostgreSQL, Redis)
 * para verificar que todo el sistema funciona correctamente.
 * 
 * Requisitos para ejecutar:
 * 1. PostgreSQL/Supabase accesible
 * 2. Redis corriendo (docker o local)
 * 3. Variables de entorno configuradas (.env)
 * 
 * Ejecutar con: npm run test:integration
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.integration.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000, // 30 segundos para conexiones
  verbose: true,
  forceExit: true, // Forzar cierre después de tests
  detectOpenHandles: true, // Detectar handles abiertos
  // Setear NODE_ENV para evitar logs innecesarios
  setupFiles: ['<rootDir>/jest.integration.setup.js'],
};
