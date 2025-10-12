import { ValidationTargets } from "@common/io/enum/ValidationTargets";
import { supportedHttpMethods } from "@common/middleware/CommonMiddleware";
import { HttpMethods } from "@utils/http/HttpMethods";
import { NextFunction, Request, Response } from "express";
import { validate } from "@common/middleware/ValidateMiddleware";
import {ManufacturerDataValidator} from "@modules/manufacturer-service/service/validator/ManufacturerDataValidator";

export const ManufacturerMiddlewares = {
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
            (req: Request, res: Response, next: NextFunction): void => validate(ManufacturerDataValidator.validateFetchByIdRequestBody.bind(null, req.params), ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: []
    }
};
