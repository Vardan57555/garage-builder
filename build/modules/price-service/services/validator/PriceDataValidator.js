"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceDataValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const SetupValidator_1 = require("../../../../utils/validator/SetupValidator");
const Constants_1 = require("../../../../common/io/Constants");
class PriceDataValidator {
    static outputSchema = joi_1.default.object().keys({
        state_id: joi_1.default.string().uuid({
            version: Constants_1.Constants.UUIDV4,
            separator: Constants_1.Constants.SEPARATOR
        }).required(),
        name: joi_1.default.string().required(),
        created_at: joi_1.default.number().required(),
        updated_at: joi_1.default.number().required()
    });
    static outputAttributesSchema = joi_1.default.object().keys({
        state_id: joi_1.default.string().uuid({
            version: Constants_1.Constants.UUIDV4,
            separator: Constants_1.Constants.SEPARATOR
        }).allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING),
        name: joi_1.default.string().allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING),
        created_at: joi_1.default.number().allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING),
        updated_at: joi_1.default.number().allow(Constants_1.Constants.NULL, Constants_1.Constants.EMPTY_STRING)
    });
    static outputItemSchema = joi_1.default.object({
        data: joi_1.default.array().items(PriceDataValidator.outputSchema).required(),
    });
    static outputValidate(data) {
        return (0, SetupValidator_1.setupValidator)(data, PriceDataValidator.outputSchema);
    }
    static outputArrayValidate(data) {
        return (0, SetupValidator_1.setupValidator)(data, PriceDataValidator.outputItemSchema);
    }
}
exports.PriceDataValidator = PriceDataValidator;
//# sourceMappingURL=PriceDataValidator.js.map