"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingMiddlewares = void 0;
const ValidationTargets_1 = require("../../../../common/io/enum/ValidationTargets");
const CommonMiddleware_1 = require("../../../../common/middleware/CommonMiddleware");
const BuildingDataValidator_1 = require("../../../building-service/services/validator/BuildingDataValidator");
const ValidateMiddleware_1 = require("../../../../common/middleware/ValidateMiddleware");
exports.BuildingMiddlewares = {
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
            (0, CommonMiddleware_1.supportedHttpMethods)("GET"),
            (req, res, next) => (0, ValidateMiddleware_1.validate)(BuildingDataValidator_1.BuildingDataValidator.validateFetchByStateAndManufacturerIdsSchema.bind(null, req.params), ValidationTargets_1.ValidationTargets.PARAMS)(req, res, next)
        ]
    },
    all: {
        fetchAllMiddlewares: []
    }
};
//# sourceMappingURL=BuildingMiddlewares.js.map