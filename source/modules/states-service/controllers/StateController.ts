import { Controller } from "@common/controller/Controller";
import {NextFunction, Request, Response} from "express";

export interface StateController extends Controller
{
    fetchAllHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    fetchByManufacturerIdHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
}
