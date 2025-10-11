import { ValidationTargets } from "@common/io/enum/ValidationTargets";
import { supportedHttpMethods } from "@common/middleware/CommonMiddleware";
import { HttpMethods } from "@utils/http/HttpMethods";
import { NextFunction, Request, Response } from "express";
import {BuildingDataValidator} from "@modules/building-service/services/validator/BuildingDataValidator";
import {validate} from "@common/middleware/ValidateMiddleware";

export const BuildingMiddlewares = {
    common: {
        idRouteMiddlewares: [
            supportedHttpMethods(HttpMethods.GET, HttpMethods.DELETE, HttpMethods.PUT),
        ],
        fetchAllMiddlewares: [
            supportedHttpMethods(HttpMethods.GET),
        ],
        createMiddlewares: [
            supportedHttpMethods(HttpMethods.POST),
        ]
    },
    fetch: {
        fetchCheckStateManufacturerMiddlewares: [
            supportedHttpMethods(HttpMethods.GET),
            (req: Request, res: Response, next: NextFunction): void => validate(BuildingDataValidator.validateFetchByStateAndManufacturerIdsSchema.bind(null, req.params), ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: []
    }
};
