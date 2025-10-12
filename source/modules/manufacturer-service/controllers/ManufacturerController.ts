import { Controller } from "@common/controller/Controller";
import { Response, Request, NextFunction} from "express";

export interface ManufacturerController extends Controller
{
    fetchAllHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    fetchManufacturerByStateHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
}
