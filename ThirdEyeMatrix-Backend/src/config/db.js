require('dotenv').config();

const knex = require('knex');

const knexConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};

const db = knex(knexConfig);

const connectDB = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('PostgreSQL Connected Successfully with Knex!');
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { db, connectDB };