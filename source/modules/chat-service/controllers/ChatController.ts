import { Controller } from "@common/controller/Controller";
import {NextFunction, Request, Response} from "express";

export interface ChatController extends Controller
{
    fetchBuildingPricingWithUtilityHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    endSessionHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
}
