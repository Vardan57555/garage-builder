import { ValidationTargets } from "@common/io/enum/ValidationTargets";
import {
    authorize,
    verifyJwtToken
} from "@common/middleware/AuthorizeMiddleware";
import { supportedHttpMethods } from "@common/middleware/CommonMiddleware";
import { validate } from "@common/middleware/ValidateMiddleware";
import {
    CompanyPermissions
} from "@modules/auth-service/authorization/authorize/io/Permissions";
import {
    CompanyDataValidator
} from "@modules/company-service/services/company/validator/CompanyDataValidator";

import { HttpMethods } from "@utils/http/HttpMethods";
import { NextFunction, Request, Response } from "express";
import {BuildingDataValidator} from "@modules/building-service/services/validator/BuildingDataValidator";

export const BuildingMiddlewares = {
    common: {
        idRouteMiddlewares: [
            supportedHttpMethods(HttpMethods.GET, HttpMethods.DELETE, HttpMethods.PUT),
            verifyJwtToken()
        ],
        fetchAllMiddlewares: [
            supportedHttpMethods(HttpMethods.GET),
            verifyJwtToken()
        ],
        createMiddlewares: [
            supportedHttpMethods(HttpMethods.POST),
            verifyJwtToken()
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
