import { Controller } from "@common/controller/Controller";
import {NextFunction, Request, Response} from "express";

export interface PriceController extends Controller
{
    fetchAllPricesHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    predictPriceHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
}
