import { StateController } from "@modules/states-service/controllers/StateController";
import { InstantiationError} from "@errors/InstantiationError";
import { ServiceResponse } from "@utils/response/ServiceResponse";
import { NextFunction, Request, Response } from "express";
import { constants as HttpStatuses } from "node:http2";
import {StateServiceImpl} from "@modules/states-service/services/impl/StateServiceImpl";
import {StateService} from "@modules/states-service/services/StateService";
import {IState} from "@modules/states-service/services/io/IState";


export class StateControllerImpl implements StateController
{
    /**
     * The singleton instance of `StateController`.
     * @private
     */

    private static instance: StateController;

    /**
     * The StateService instance.
     * @private
     */
    private service: StateService;

    /**
     * Constructs a new StateController instance.
     *
     * @param service - The StateService instance to use for state operations.
     * @param enforce - A function to enforce the Singleton pattern.
     * @throws Error if instantiated directly.
     */
    constructor(service: StateService, enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateController.getInstance() instead of new.");
        }

        this.service = service;
    }

    /**
     * Returns the singleton instance of StateController.
     *
     * @returns The singleton instance of StateController.
     */
    public static getInstance(): StateController
    {
        if(!StateControllerImpl.instance)
        {
            StateControllerImpl.instance = new StateControllerImpl(StateServiceImpl.getInstance(), Enforce);
        }

        return StateControllerImpl.instance;
    }

    /**
     * Handles retrieving all states.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */
    public fetchAllHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let states: IState | IState[];

        try
        {
            states = await this.service.fetchAll();
        }
        catch (error)
        {
            next(error);

            return;
        }

        this.handleSuccessResponse(res, states);
    };


    /**
     * Handles retrieving all states by manufacturer id.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */
    public fetchByManufacturerIdHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let states: IState | IState[];

        try
        {
            states = await this.service.fetchByManufacturerId(req.params);
        }
        catch (error)
        {
            next(error);

            return;
        }

        this.handleSuccessResponse(res, states);
    };

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
