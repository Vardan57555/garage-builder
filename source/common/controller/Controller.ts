import { NextFunction, Request, Response } from "express";

export interface Controller
{
    createHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    updateHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    deleteHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    fetchByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    fetchAllHandler(req: Request, res: Response, next: NextFunction): Promise<void>;

    handleSuccessResponse(res: Response, outcome: {}, pagination?: boolean, status?: number): void;
}
