import { supportedHttpMethods } from "@common/middleware/CommonMiddleware";
import { HttpMethods } from "@utils/http/HttpMethods";
import {NextFunction, Request, Response} from "express";
import {validate} from "@common/middleware/ValidateMiddleware";
import {StateDataValidator} from "@modules/states-service/services/validator/StateDataValidator";
import {ValidationTargets} from "@common/io/enum/ValidationTargets";

export const StateMiddlewares = {
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
            (req: Request, res: Response, next: NextFunction): void => validate(StateDataValidator.validateFetchByIdRequestBody.bind(null, req.params), ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: []
    }
};
