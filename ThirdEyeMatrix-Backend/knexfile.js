require('dotenv').config();

const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env

const common = {
    client : 'pg',
    migrations: {
        tableName: 'knex_migrations',
        directory: './migrations',
    },
    seeds: {
        directory: './src/seeds'
    },
}

module.exports = {
    development : {
        ...common,
        connection : {
            host: DB_HOST,
            port: Number(DB_PORT),
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        },
        pool: { min: 0, max: 10 }
    },
    production : {
        ...common,
        connection : {
            host: DB_HOST,
            port: Number(DB_PORT),
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        },
        pool: { min: 2, max: 10 }
    }
};