import { InstantiationError } from "@errors/InstantiationError";
import { CustomRouter } from "@utils/router/CustomRouter";
import {BuildingRouter} from "@modules/building-service/routes/BuildingRouter";
import {StateRouter} from "@modules/states-service/routes/StateRouter";
import {ManufacturerRouter} from "@modules/manufacturer-service/routes/ManufacturerRouter";
import {PriceRouter} from "@modules/price-service/routes/PriceRouter";
import {ChatRouter} from "@modules/chat-service/routes/ChatRouter";

/**
 * Class representing the API routes.
 * Extends the `CustomRouter` to define API routes.
 */
export class ApiRouter extends CustomRouter
{
    /**
     * The singleton instance of `ApiRouter`.
     */
    private static instance: ApiRouter;

    /**
     * Creates an instance of `ApiRouter`.
     * Initializes the routes wit all endpoints.
     */
    constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ApiRouter.getInstance() instead of new.");
        }

        super();

        /**
         * Use the `BuildingRouter` for handling `/building` endpoint.
         * @param path - The path for the route.
         * @param router - The routes instance to use.
         */
        this.use("/building", BuildingRouter.getInstance());

        /**
         * Use the `StateRouter` for handling `/state` endpoint.
         * @param path - The path for the route.
         * @param router - The routes instance to use.
         */
        this.use("/state", StateRouter.getInstance());

        /**
         * Use the `ManufacturerRouter` for handling `/manufacturer` endpoint.
         * @param path - The path for the route.
         * @param router - The routes instance to use.
         */
        this.use("/manufacturer", ManufacturerRouter.getInstance());

        /**
         * Use the `PriceRouter` for handling `/price` endpoint.
         * @param path - The path for the route.
         * @param router - The routes instance to use.
         */
        this.use("/price", PriceRouter.getInstance());

        /**
         * Use the `PriceRouter` for handling `/chat` endpoint.
         * @param path - The path for the route.
         * @param router - The routes instance to use.
         */
        this.use("/chat", ChatRouter.getInstance());
    }

    /**
     * Returns the singleton instance of `ApiRouter`.
     * If the instance does not exist, it creates one.
     */
    public static getInstance(): ApiRouter
    {
        if (!ApiRouter.instance)
        {
            ApiRouter.instance = new ApiRouter(Enforce);
        }

        return ApiRouter.instance;
    }
}

function Enforce(): void
{
}
