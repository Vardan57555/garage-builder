"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturerMiddlewares = void 0;
const ValidationTargets_1 = require("../../../../common/io/enum/ValidationTargets");
const CommonMiddleware_1 = require("../../../../common/middleware/CommonMiddleware");
const ValidateMiddleware_1 = require("../../../../common/middleware/ValidateMiddleware");
const ManufacturerDataValidator_1 = require("../../../manufacturer-service/service/validator/ManufacturerDataValidator");
exports.ManufacturerMiddlewares = {
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
            (req, res, next) => (0, ValidateMiddleware_1.validate)(ManufacturerDataValidator_1.ManufacturerDataValidator.validateFetchByIdRequestBody.bind(null, req.params), ValidationTargets_1.ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: []
    }
};
//# sourceMappingURL=ManufacturerMiddlewares.js.map