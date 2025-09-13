import { config } from './src/config/environment';

module.exports = {
  development: {
    client: 'pg',
    connection: config.database.url,
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: config.database.url,
    migrations: {
      directory: './dist/database/migrations',
      extension: 'js',
    },
    seeds: {
      directory: './dist/database/seeds',
      extension: 'js',
    },
  },
};
