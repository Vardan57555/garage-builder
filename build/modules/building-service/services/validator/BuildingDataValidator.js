"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingDataValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const SetupValidator_1 = require("../../../../utils/validator/SetupValidator");
class BuildingDataValidator {
    static fetchByStateAndManufacturerIdsSchema = joi_1.default.object().keys({
        state_id: joi_1.default.string().required(),
        manufacturer_id: joi_1.default.string().required(),
        state_check: joi_1.default.boolean().default(false)
    });
    static validateFetchByStateAndManufacturerIdsSchema(data) {
        return (0, SetupValidator_1.setupValidator)(data, BuildingDataValidator.fetchByStateAndManufacturerIdsSchema);
    }
}
exports.BuildingDataValidator = BuildingDataValidator;
//# sourceMappingURL=BuildingDataValidator.js.map