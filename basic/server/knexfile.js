const path = require('path');

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'example',
      port: 5432,
      database: 'postgres',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migration: {
      directory: path.join(__dirname, 'db', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'db', 'seeds'),
    },
  },
};
