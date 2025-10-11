require("dotenv").config();

module.exports = {
    development: {
        dialect: "mysql",
        host: process.env.MYSQL_DB_HOST,
        port: Number(process.env.MYSQL_DB_PORT),
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB
    },
    testing: {
        dialect: "mysql",
        host: process.env.MYSQL_DB_HOST,
        port: Number(process.env.MYSQL_DB_PORT),
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB
    },
    production: {
        dialect: "mysql",
        host: process.env.MYSQL_DB_HOST,
        port: Number(process.env.MYSQL_DB_PORT),
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};
