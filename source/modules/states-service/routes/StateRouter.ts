import {CustomRouter} from "@utils/router/CustomRouter";
import {InstantiationError} from "@errors/InstantiationError";
import {StateControllerImpl} from "@modules/states-service/controllers/impl/StateControllerImpl";
import {StateController} from "@modules/states-service/controllers/StateController";
import {StateMiddlewares} from "@modules/states-service/routes/io/StateMiddlewares";

export class StateRouter extends CustomRouter
{
    /**
     * The singleton instance of `StateRouter`.
     * */
    private static instance: StateRouter;


    /**
     * The controllers instance for handling state-related requests.
     */

    private readonly controller: StateController;

    constructor(controller: StateController, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }

    /**
     * Returns the singleton instance of StateRouter.
     *
     * @returns The singleton instance of StateRouter.
     */

    public static getInstance(): StateRouter
    {
        if(!StateRouter.instance)
        {
            StateRouter.instance = new StateRouter(StateControllerImpl.getInstance(), Enforce);
        }
        return StateRouter.instance;
    }


    /**
     * Initializes the routes for the routes.
     * Defines the endpoints and their corresponding handlers.
     * @private
     */

    private initializeRoutes(): void
    {
        this.route("/")
            .all(...StateMiddlewares.common.fetchAllMiddlewares)
            .get(this.controller.fetchAllHandler);

        this.route("/:manufacturer_id")
            .all(...StateMiddlewares.common.idRouteMiddlewares)
            .get(...StateMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchByManufacturerIdHandler);
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
