/**
 * Interface for the Postgres configuration.
 */
export interface IPostgresConfig
{
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    logging: boolean;
    dialect: "mysql" | "postgres" | "sqlite" | "mariadb" | "mssql" | "db2" | "snowflake" | "oracle";
    pool: {
        max: number;
        min: number;
        acquire: number;
        idle: number;
    };
    retry: {
        max_retry: number;
        match_options: string[];
    };
}
