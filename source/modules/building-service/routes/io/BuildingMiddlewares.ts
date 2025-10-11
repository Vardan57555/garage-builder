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

export const CompanyMiddlewares = {
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
    create: {
        createMiddlewares: [
            authorize(CompanyPermissions.CREATE_COMPANY),
            (req: Request, res: Response, next: NextFunction): void => validate(CompanyDataValidator.validateCreateRequestBody.bind(null, req.body), ValidationTargets.BODY)(req, res, next)
        ]
    },
    fetch: {
        fetchByIdMiddlewares: [
            authorize(
                CompanyPermissions.READ_COMPANY,
                CompanyPermissions.READ_COMPANY_STRICT,
                CompanyPermissions.READ_COMPANY_SELF
            ),
            (req: Request, res: Response, next: NextFunction): void => validate(CompanyDataValidator.validateFetchByIdRequestBody.bind(null, req.params), ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    update: {
        updateByIdMiddlewares: [
            authorize(
                CompanyPermissions.UPDATE_COMPANY,
                CompanyPermissions.UPDATE_COMPANY_SELF
            ),
            (req: Request, res: Response, next: NextFunction): void => validate(CompanyDataValidator.validateUpdateRequestBody.bind(null, req.body), ValidationTargets.BODY)(req, res, next),
            (req: Request, res: Response, next: NextFunction): void => validate(CompanyDataValidator.validateUpdateRequestParams.bind(null, req.params), ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    delete: {
        deleteByIdMiddlewares: [
            authorize(CompanyPermissions.DELETE_COMPANY),
            (req: Request, res: Response, next: NextFunction): void => validate(CompanyDataValidator.validateDeleteRequestBody.bind(null, req.params), ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: [authorize(CompanyPermissions.READ_COMPANY, CompanyPermissions.READ_COMPANY_STRICT, CompanyPermissions.READ_COMPANY_SELF)]
    }
};
