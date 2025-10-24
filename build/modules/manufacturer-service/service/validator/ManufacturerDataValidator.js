"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturerDataValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const SetupValidator_1 = require("../../../../utils/validator/SetupValidator");
const Constants_1 = require("../../../../common/io/Constants");
class ManufacturerDataValidator {
    static fetchByIdRequestBodySchema = joi_1.default.object().keys({
        id: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).uuid({
            version: Constants_1.Constants.UUIDV4,
            separator: Constants_1.Constants.SEPARATOR
        }).required()
    });
    static outputSchema = joi_1.default.object().keys({
        manufacturer_id: joi_1.default.string().uuid({
            version: Constants_1.Constants.UUIDV4,
            separator: Constants_1.Constants.SEPARATOR
        }).required(),
        created_at: joi_1.default.number().required(),
        updated_at: joi_1.default.number().required()
    });
    static outputAttributesSchema = joi_1.default.object().keys({
        manufacturer_id: joi_1.default.string().uuid({
            version: Constants_1.Constants.UUIDV4,
            separator: Constants_1.Constants.SEPARATOR
        }).allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING),
        name: joi_1.default.string().allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING),
        created_at: joi_1.default.number().allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING),
        updated_at: joi_1.default.number().allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING)
    });
    static outputItemSchema = joi_1.default.object({
        data: joi_1.default.array().items(ManufacturerDataValidator.outputSchema).required(),
    });
    static validateFetchByIdRequestBody(data) {
        return (0, SetupValidator_1.setupValidator)(data, ManufacturerDataValidator.fetchByIdRequestBodySchema);
    }
    static outputValidate(data) {
        return (0, SetupValidator_1.setupValidator)(data, ManufacturerDataValidator.outputSchema);
    }
    static outputArrayValidate(data) {
        return (0, SetupValidator_1.setupValidator)(data, ManufacturerDataValidator.outputItemSchema);
    }
}
exports.ManufacturerDataValidator = ManufacturerDataValidator;
//# sourceMappingURL=ManufacturerDataValidator.js.map