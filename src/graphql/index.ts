import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schemas/schema';
import { resolvers } from './resolvers/resolvers';
import express from 'express';
import cors from 'cors';

/**
 * Crea y configura el servidor Apollo GraphQL
 */
export const createApolloServer = async (app: express.Application) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Iniciar el servidor Apollo
  await server.start();

  // Integrar Apollo como middleware de Express en /graphql
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server) as any
  );

  console.log('🚀 GraphQL server ready at /graphql');

  return server;
};

export { typeDefs, resolvers };