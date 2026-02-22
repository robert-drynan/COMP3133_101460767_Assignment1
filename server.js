require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const connectDB = require('./config/db');
const { typeDefs, resolvers } = require('./graphql/schema');

async function startServer() {
  const app = express();

  await connectDB();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
}
//
startServer();