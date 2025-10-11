import { Response} from "express";

export interface Controller
{
    handleSuccessResponse(res: Response, outcome: {}, pagination?: boolean, status?: number): void;
}
