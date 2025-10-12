import { InstantiationError} from "@errors/InstantiationError";
import { ServiceResponse } from "@utils/response/ServiceResponse";
import {NextFunction, Request, Response} from "express";
import { constants as HttpStatuses } from "node:http2";
import {ManufacturerController} from "@modules/manufacturer-service/controllers/ManufacturerController";
import {ManufacturerService} from "@modules/manufacturer-service/service/ManufacturerService";
import {IManufacturer} from "@modules/manufacturer-service/service/io/IManufacturer";
import {ManufacturerServiceImpl} from "@modules/manufacturer-service/service/impl/ManufacturerServiceImpl";


export class ManufacturerControllerImpl implements ManufacturerController
{
    /**
     * The singleton instance of `ManufacturerController`.
     * @private
     */

    private static instance: ManufacturerController;

    /**
     * The ManufacturerService instance.
     * @private
     */
    private service: ManufacturerService;

    /**
     * Constructs a new ManufacturerController instance.
     *
     * @param service - The ManufacturerService instance to use for manufacturer operations.
     * @param enforce - A function to enforce the Singleton pattern.
     * @throws Error if instantiated directly.
     */
    constructor(service: ManufacturerService, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateController.getInstance() instead of new.");
        }

        this.service = service;
    }

    /**
     * Returns the singleton instance of ManufacturerController.
     *
     * @returns The singleton instance of ManufacturerController.
     */
    public static getInstance(): ManufacturerController
    {
        if(!ManufacturerControllerImpl.instance)
        {
            ManufacturerControllerImpl.instance = new ManufacturerControllerImpl(ManufacturerServiceImpl.getInstance(), Enforce);
        }

        return ManufacturerControllerImpl.instance;
    }

    /**
     * Handles retrieving all manufactures.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */
    public fetchAllHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let manufactures: IManufacturer | IManufacturer[];

        try
        {
            manufactures = await this.service.fetchAll();
        }
        catch (error)
        {
            next(error);

            return;
        }

        this.handleSuccessResponse(res, manufactures);
    };

    /**
     * Handles retrieving all manufactures by state id.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */

    public fetchManufacturerByStateHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let manufacturer: IManufacturer | IManufacturer[];

        try
        {
            manufacturer = await this.service.fetchManufacturerByState(req.params);
        }
        catch (error)
        {
            next(error);

            return;
        }

        this.handleSuccessResponse(res, manufacturer);
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
{
}
