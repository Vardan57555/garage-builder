require("dotenv").config();

module.exports = {
    development: {
        dialect: "postgres",
        host: process.env.POSTGRES_DB_HOST,
        port: Number(process.env.POSTGRES_DB_PORT),
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    },
    testing: {
        dialect: "postgres",
        host: process.env.POSTGRES_DB_HOST,
        port: Number(process.env.POSTGRES_DB_PORT),
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    },
    production: {
        dialect: "postgres",
        host: process.env.POSTGRES_DB_HOST,
        port: Number(process.env.POSTGRES_DB_PORT),
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};
