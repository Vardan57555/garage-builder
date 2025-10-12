/**
 * Interface representing the application configuration.
 */
export interface IAppConfig
{
    port: number;
    debug: boolean;
    start_delay: number;
    name: string;
    origins: {
        enabled: boolean;
        domains: string[];
    };
    k8s: {
        readiness: {
            period: number;
            threshold: number;
        };
        liveness: {
            period: number;
            threshold: number;
        };
    };
}
