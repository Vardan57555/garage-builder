import {CustomRouter} from "@utils/router/CustomRouter";
import {BuildingController} from "@modules/building-service/controllers/BuildingController";
import {InstantiationError} from "@errors/InstantiationError";
import {BuildingControllerImpl} from "@modules/building-service/controllers/impl/BuildingControllerImpl";
import {BuildingMiddlewares} from "@modules/building-service/routes/io/BuildingMiddlewares";

export class BuildingRouter extends CustomRouter
{
    /**
     * The singleton instance of `BuildingRouter`.
     * */
    private static instance: BuildingRouter;


    /**
     * The controllers instance for handling company-related requests.
     */

    private readonly controller: BuildingController;

    constructor(controller: BuildingController, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use BuildingRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }

    /**
     * Returns the singleton instance of BuildingRouter.
     *
     * @returns The singleton instance of BuildingRouter.
     */

    public static getInstance(): BuildingRouter
    {
        if(!BuildingRouter.instance)
        {
            BuildingRouter.instance = new BuildingRouter(BuildingControllerImpl.getInstance(), Enforce);
        }
        return BuildingRouter.instance;
    }


    /**
     * Initializes the routes for the routes.
     * Defines the endpoints and their corresponding handlers.
     * @private
     */

    private initializeRoutes(): void
    {
        this.route("/building-data")
            .all(...BuildingMiddlewares.common.fetchAllMiddlewares)
            .get(...BuildingMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchBuildingDataHandler);
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
