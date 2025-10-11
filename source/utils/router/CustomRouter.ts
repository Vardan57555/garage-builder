import express, { IRoute } from "express";

/**
 * Abstract class representing a custom router.
 * This class provides methods to manage routes and middleware.
 */
export abstract class CustomRouter
{
    /**
     * The Express router instance.
     */
    public router: express.Router;

    /**
     * Constructs a new CustomRouter instance.
     */
    protected constructor()
    {
        this.router = express.Router();
    }

    /**
     * Returns the Express router instance.
     *
     * @returns {express.Router} The Express router instance.
     */
    public getRouter(): express.Router
    {
        return this.router;
    }

    /**
     * Uses the specified router for the given path.
     *
     * @param {string} path - The path for the route.
     * @param {CustomRouter} router - The router instance to use.
     */
    public use(path: string, router: CustomRouter): void
    {
        this.router.use(path, router.getRouter());
    }

    /**
     * Defines a route with the specified path.
     *
     * @param {string} path - The path for the route.
     * @returns {IRoute} The route instance.
     */
    public route(path: string): IRoute
    {
        return this.router.route(path);
    }
}
