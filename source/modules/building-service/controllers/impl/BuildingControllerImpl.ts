import { BuildingController } from "@modules/building-service/controllers/BuildingController";
import { InstantiationError} from "@errors/InstantiationError";
import { BuildingService } from "@modules/building-service/services/BuildingService";
import { createLogger } from "@utils/logger/Log";
import { ServiceResponse } from "@utils/response/ServiceResponse";
import { NextFunction, Request, Response } from "express";
import { constants as HttpStatuses } from "node:http2";
import pino from "pino";
import {BuildingServiceImpl} from "@modules/building-service/services/impl/BuildingServiceImpl";

const logger: pino.Logger = createLogger(module);

export class BuildingControllerImpl implements BuildingController
{
    /**
     * The singleton instance of `BuildingController`.
     * @private
     */

    private static instance: BuildingController;

    /**
     * The CompanyService instance.
     * @private
     */
    private service: BuildingService;

    /**
     * Constructs a new CompanyController instance.
     *
     * @param service - The CompanyService instance to use for company operations.
     * @param enforce - A function to enforce the Singleton pattern.
     * @throws Error if instantiated directly.
     */
    constructor(service: BuildingService, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use BuildingController.getInstance() instead of new.");
        }

        this.service = service;
    }

    /**
     * Returns the singleton instance of CompanyController.
     *
     * @returns The singleton instance of CompanyController.
     */
    public static getInstance(): BuildingController
    {
        if(!BuildingControllerImpl.instance)
        {
            BuildingControllerImpl.instance = new BuildingControllerImpl(BuildingServiceImpl.getInstance(), Enforce);
        }

        return BuildingControllerImpl.instance;
    }

    /**
     * Handles the creation of a new company.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */
    public fetchBuildingDataHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let building;

        try
        {
            building = await this.service.fetchBuildingData(req.params);
        }
        catch(error)
        {
            logger.error(`Error getting building data: ${error.message}`);
            next(error);
            return;
        }

        this.handleSuccessResponse(res, building)
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
