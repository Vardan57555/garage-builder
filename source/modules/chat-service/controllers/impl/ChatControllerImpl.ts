import { InstantiationError} from "@errors/InstantiationError";
import { ServiceResponse } from "@utils/response/ServiceResponse";
import { NextFunction, Request, Response } from "express";
import { constants as HttpStatuses } from "node:http2";
import {ChatService} from "@modules/chat-service/services/ChatService";
import {ChatController} from "@modules/chat-service/controllers/ChatController";
import {ChatServiceImpl} from "@modules/chat-service/services/impl/ChatServiceImpl";
import {ServerError} from "@errors/ServerError";
import { IAiAnswer } from "@common/io/IAiAgent";

export class ChatControllerImpl implements ChatController
{
    /**
     * The singleton instance of `ChatController`.
     * @private
     */

    private static instance: ChatController;

    /**
     * The ChatService instance.
     * @private
     */
    private service: ChatService;

    /**
     * Constructs a new ChatController instance.
     *
     * @param service - The ChatService instance to use for state operations.
     * @param enforce - A function to enforce the Singleton pattern.
     * @throws Error if instantiated directly.
     */
    constructor(service: ChatService, enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ChatController.getInstance() instead of new.");
        }

        this.service = service;
    }

    /**
     * Returns the singleton instance of StateController.
     *
     * @returns The singleton instance of StateController.
     */

    public static getInstance(): ChatController
    {
        if (!ChatControllerImpl.instance)
        {
            ChatControllerImpl.instance = new ChatControllerImpl(ChatServiceImpl.getInstance(), Enforce);
        }

        return ChatControllerImpl.instance;
    }

    /**
     * Handles retrieving all pricing.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */

    public fetchBuildingPricingWithUtilityHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let pricesWithUtility: IAiAnswer;

        try
        {
            const clientIp: string = this.getClientIp(req);
            const userAgent: string = req.headers['user-agent'] || 'unknown';

            pricesWithUtility = await this.service.generateAssistantResponse(req.body, clientIp, userAgent);
        }
        catch (error)
        {
            next(error);
            return;
        }

        this.handleSuccessResponse(res, pricesWithUtility);
    }

    /**
     * Handles retrieving all pricing.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function.
     */

    public endSessionHandler: (req: Request, res: Response, next: NextFunction) => Promise<void> = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        let result: { success?: boolean; message?: string; };

        const { sessionId } = req.body;

        if (!sessionId)
        {
            throw new ServerError(ServerError.INTERNAL, "sessionId is required to end a session");
        }

        try
        {
            result = await this.service.endSession(sessionId);
        }
        catch (error)
        {
            next(error);
            return;
        }

        this.handleSuccessResponse(res, result);
    }

    /**
     * Helper method to get client IP (handles proxies)
     * Checks X-Forwarded-For header first (for proxies), then falls back to req.ip
     */

    private getClientIp(req: Request): string
    {
        const xForwardedFor: string | string[] = req.headers['x-forwarded-for'];

        if (xForwardedFor)
        {
            const ips: string = Array.isArray(xForwardedFor)
                ? xForwardedFor[0]
                : xForwardedFor.split(',')[0];

            return ips.trim();
        }

        return req.ip || 'unknown';
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
