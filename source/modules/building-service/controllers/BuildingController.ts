import { Controller } from "@common/controller/Controller";
import {NextFunction, Request, Response} from "express";

export interface BuildingController extends Controller
{
    fetchBuildingDataHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
}
