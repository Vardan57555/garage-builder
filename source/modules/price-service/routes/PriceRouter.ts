import {CustomRouter} from "@utils/router/CustomRouter";
import {InstantiationError} from "@errors/InstantiationError";
import {StateMiddlewares} from "@modules/states-service/routes/io/StateMiddlewares";
import {PriceController} from "@modules/price-service/controllers/PriceController";
import {PriceControllerImpl} from "@modules/price-service/controllers/impl/PriceControllerImpl";

export class PriceRouter extends CustomRouter
{
    /**
     * The singleton instance of `PriceRouter`.
     * */
    private static instance: PriceRouter;


    /**
     * The controllers instance for handling price-related requests.
     */

    private readonly controller: PriceController;

    constructor(controller: PriceController, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }

    /**
     * Returns the singleton instance of PriceRouter.
     *
     * @returns The singleton instance of PriceRouter.
     */

    public static getInstance(): PriceRouter
    {
        if(!PriceRouter.instance)
        {
            PriceRouter.instance = new PriceRouter(PriceControllerImpl.getInstance(), Enforce);
        }
        return PriceRouter.instance;
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
            .get(this.controller.fetchAllPricesHandler);

        this.route("/predict")
            .all(...StateMiddlewares.common.fetchAllMiddlewares)
            .get(this.controller.predictPriceHandler);

        // this.route("/:manufacturer_id")
        //     .all(...StateMiddlewares.common.idRouteMiddlewares)
        //     .get(...StateMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchBuildingPricingWithUtilityHandler);
        //     .get(this.controller.fetchBuildingPricingWithUtilityHandler);
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
