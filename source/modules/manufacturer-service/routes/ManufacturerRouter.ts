import {CustomRouter} from "@utils/router/CustomRouter";
import {InstantiationError} from "@errors/InstantiationError";
import {ManufacturerController} from "@modules/manufacturer-service/controllers/ManufacturerController";
import {ManufacturerControllerImpl} from "@modules/manufacturer-service/controllers/impl/ManufacturerControllerImpl";
import {ManufacturerMiddlewares} from "@modules/manufacturer-service/routes/io/ManufacturerMiddlewares";

export class ManufacturerRouter extends CustomRouter
{
    /**
     * The singleton instance of `ManufacturerRouter`.
     * */
    private static instance: ManufacturerRouter;


    /**
     * The controllers instance for handling manufacturer-related requests.
     */

    private readonly controller: ManufacturerController;

    constructor(controller: ManufacturerController, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ManufacturerRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }

    /**
     * Returns the singleton instance of ManufacturerRouter.
     *
     * @returns The singleton instance of ManufacturerRouter.
     */

    public static getInstance(): ManufacturerRouter
    {
        if(!ManufacturerRouter.instance)
        {
            ManufacturerRouter.instance = new ManufacturerRouter(ManufacturerControllerImpl.getInstance(), Enforce);
        }

        return ManufacturerRouter.instance;
    }


    /**
     * Initializes the routes for the routes.
     * Defines the endpoints and their corresponding handlers.
     * @private
     */

    private initializeRoutes(): void
    {
        this.route("/")
            .all(...ManufacturerMiddlewares.common.fetchAllMiddlewares)
            .get(this.controller.fetchAllHandler);

        this.route("/:state_id")
            .all(...ManufacturerMiddlewares.common.idRouteMiddlewares)
            .get(...ManufacturerMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchManufacturerByStateHandler);
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
