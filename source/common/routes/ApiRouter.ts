import { InstantiationError } from "@errors/InstantiationError";
import { RoleManagementRouter } from "@modules/auth-service/role-management/routes/RoleManagementRouter";
import { AuthBaseRouter } from "@modules/auth-service/routes/AuthBaseRouter";
import { CompanyBaseRouter } from "@modules/company-service/routes/CompanyBaseRouter";
import { FileRouter } from "@modules/file-service/routes/FileRouter";
import { FulfillmentBaseRouter } from "@modules/fulfillment-service/routes/FulfillmentBaseRouter";
import { LocationBaseRouter } from "@modules/location-service/routes/LocationBaseRouter";
import { NgoRouter } from "@modules/ngo-service/routes/NgoRouter";
import { PaymentRouter } from "@modules/payment-service/routes/PaymentRouter";
import { RegionRouter } from "@modules/region-service/routes/RegionRouter";
import { ReviewRouter } from "@modules/review-service/routes/ReviewRouter";
import { CustomerRouter } from "@modules/user-service/routes/customer/CustomerRouter";
import { ReviewerRouter } from "@modules/user-service/routes/reviewer/ReviewerRouter";
import { UserRouter } from "@modules/user-service/routes/user/UserRouter";
import { CustomRouter } from "@utils/router/CustomRouter";
import { LeadAgentRouter } from "@modules/lead-agent-service/routes/LeadAgentRouter";

/**
 * Class representing the API router.
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
     * Initializes the router wit all endpoints.
     */
    constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ApiRouter.getInstance() instead of new.");
        }

        super();

        /**
         * Use the `CustomerRouter` for handling `/customer` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/customer", CustomerRouter.getInstance());

        /**
         * Use the `UserRouter` for handling `/user` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/user", UserRouter.getInstance());

        /**
         * Use the `ReviewRouter` for handling `/reviewer` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/reviewer", ReviewerRouter.getInstance());

        /**
         * Use the `PaymentRouter` for handling `/payment` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/payment", PaymentRouter.getInstance());

        /**
         * Use the `AuthBaseRouter` for handling `/auth` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/auth", AuthBaseRouter.getInstance());

        /**
         * Use the `CompanyBaseRouter` for handling `/company` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/company", CompanyBaseRouter.getInstance());

        /**
         * Use the `LocationBaseRouter` for handling `/location` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/location", LocationBaseRouter.getInstance());

        /**
         * Use the `ReviewRouter` for handling `/review` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/review", ReviewRouter.getInstance());

        /**
         * Use the `NgoRouter` for handling `/ngo` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */

        this.use("/ngo", NgoRouter.getInstance());

        /**
         * Use the `FileRouter` for handling `/file` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/file", FileRouter.getInstance());

        /**
         * Use the `RoleManagementRouter` for handling `/file` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/authorization", RoleManagementRouter.getInstance());

        /**
         * Use the `RegionRouter` for handling `/region` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/region", RegionRouter.getInstance());

        /**
         * Use the `FulfillmentBaseRouter` for handling `/fulfillment` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/fulfillment", FulfillmentBaseRouter.getInstance());

        /**
         * Use the `LeadAgentRouter` for handling `/chat` endpoint.
         * @param path - The path for the route.
         * @param router - The router instance to use.
         */
        this.use("/assistant", LeadAgentRouter.getInstance());
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
