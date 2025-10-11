/**
 * Interface for the AuthConfig object.
 * @interface IAuthConfig
 */
export interface IAuthConfig
{
    clientId: string;
    clientSecret: string;
    jwt_secret: string;
    callbackUrl: string;
    sessionSecret: string;
    frontend_url: string;
    reviro_host: string;
}

export interface IYandexAuthConfig
{
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}
