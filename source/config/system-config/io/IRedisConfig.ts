/**
 * Redis configuration interface
 */
export interface IRedisConfig
{
    host: string;
    port: number;
    password: string;
    timeout: number;
    isLazyConnect: boolean;
}
