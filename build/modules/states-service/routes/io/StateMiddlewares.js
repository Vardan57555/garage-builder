"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMiddlewares = void 0;
const CommonMiddleware_1 = require("../../../../common/middleware/CommonMiddleware");
const ValidateMiddleware_1 = require("../../../../common/middleware/ValidateMiddleware");
const StateDataValidator_1 = require("../../../states-service/services/validator/StateDataValidator");
const ValidationTargets_1 = require("../../../../common/io/enum/ValidationTargets");
exports.StateMiddlewares = {
    common: {
        idRouteMiddlewares: [
            (0, CommonMiddleware_1.supportedHttpMethods)("GET", "DELETE", "PUT"),
        ],
        fetchAllMiddlewares: [
            (0, CommonMiddleware_1.supportedHttpMethods)("GET"),
        ],
        createMiddlewares: [
            (0, CommonMiddleware_1.supportedHttpMethods)("POST"),
        ]
    },
    fetch: {
        fetchCheckStateManufacturerMiddlewares: [
            (req, res, next) => (0, ValidateMiddleware_1.validate)(StateDataValidator_1.StateDataValidator.validateFetchByIdRequestBody.bind(null, req.params), ValidationTargets_1.ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: []
    }
};
//# sourceMappingURL=StateMiddlewares.js.map