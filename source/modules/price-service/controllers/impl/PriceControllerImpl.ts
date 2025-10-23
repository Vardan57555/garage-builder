import { InstantiationError} from "@errors/InstantiationError";
import { ServiceResponse } from "@utils/response/ServiceResponse";
import {NextFunction, Request, Response} from "express";
import { constants as HttpStatuses } from "node:http2";
import {PriceController} from "@modules/price-service/controllers/PriceController";
import {PriceService} from "@modules/price-service/services/PriceService";
import {PriceServiceImpl} from "@modules/price-service/services/impl/PriceServiceImpl";
import { IPrice } from "@modules/price-service/services/io/IPrice";

export class PriceControllerImpl implements PriceController
{
    /**
     * The singleton instance of `PriceController`.
     * @private
     */

    private static instance: PriceController;

    /**
     * The PriceService instance.
     * @PriceService
     */
    private service: PriceService;

    /**
     * Constructs a new PriceController instance.
     *
     * @param service - The PriceService instance to use for prices operations.
     * @param enforce - A function to enforce the Singleton pattern.
     * @throws Error if instantiated directly.
     */
    constructor(service: PriceService, enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceController.getInstance() instead of new.");
        }

        this.service = service;
    }

    /**
     * Returns the singleton instance of PriceController.
     *
     * @returns The singleton instance of PriceController.
     */

    public static getInstance(): PriceController {
        if (!PriceControllerImpl.instance) {
            PriceControllerImpl.instance = new PriceControllerImpl(PriceServiceImpl.getInstance(), Enforce);
        }

        return PriceControllerImpl.instance;
    }

    /**
     * Handles retrieving all pricing.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */

    public fetchAllPricesHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let prices: Promise<IPrice | IPrice[]>;

        try
        {
            prices = this.service.fetchAllPrices(req.body);
        }
        catch (error)
        {
            next(error);
            return;
        }

        this.handleSuccessResponse(res, prices);
    }

    /**
     * Handles the service response.
     *
     * @param res - The response object.
     * @param outcome - The outcome of the service operation.
     * @param pagination - A flag indicating whether to include pagination data.
     * @param status - The HTTP status code to set.
     */
    public handleSuccessResponse(res: Response, outcome: {}, pagination: boolean = false, status: number = HttpStatuses.HTTP_STATUS_OK): void
    {
        const serviceResponse: ServiceResponse = new ServiceResponse(res).setStatus(status);
        serviceResponse.setOutcome(outcome);
        serviceResponse.send();
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{}
