"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturerServiceImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ServerError_1 = require("../../../../errors/ServerError");
const ResponseTypes_1 = require("../../../../common/io/enum/ResponseTypes");
const ValidationError_1 = require("../../../../errors/ValidationError");
const Manufacturer_1 = __importDefault(require("../../../../config/db/models/Manufacturer"));
const ManufacturerDataValidator_1 = require("../../../manufacturer-service/service/validator/ManufacturerDataValidator");
class ManufacturerServiceImpl {
    static instance;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateService.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!ManufacturerServiceImpl.instance) {
            ManufacturerServiceImpl.instance = new ManufacturerServiceImpl(Enforce);
        }
        return ManufacturerServiceImpl.instance;
    }
    async fetchAll() {
        let manufacturers;
        try {
            manufacturers = await Manufacturer_1.default.findAll({
                order: [["name", "ASC"]],
            });
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to get all manufacturer with error:  ${error.message}`);
        }
        return this.validateOutput(manufacturers, ResponseTypes_1.ValidationTypes.ALL);
    }
    async fetchManufacturerByState(body) {
        let manufacturers;
        try {
            manufacturers = await Manufacturer_1.default.findAll({
                group: ["Manufacturer.manufacturer_id"],
                order: [["manufacturer_id", "ASC"]],
            });
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to get all manufacturer by manufacturer id with error:  ${error.message}`);
        }
        return this.validateOutput(manufacturers, ResponseTypes_1.ValidationTypes.ALL);
    }
    validateOutput(manufacturer, type = ResponseTypes_1.ValidationTypes.SINGLE) {
        const validationMethods = {
            [ResponseTypes_1.ValidationTypes.SINGLE]: ManufacturerDataValidator_1.ManufacturerDataValidator.outputValidate,
            [ResponseTypes_1.ValidationTypes.ALL]: ManufacturerDataValidator_1.ManufacturerDataValidator.outputArrayValidate
        };
        const outputValidation = validationMethods[type](manufacturer);
        if (outputValidation.error) {
            throw new ValidationError_1.ValidationError(ValidationError_1.ValidationError.OUTPUT, outputValidation.error.message);
        }
        return outputValidation.value;
    }
}
exports.ManufacturerServiceImpl = ManufacturerServiceImpl;
function Enforce() {
}
//# sourceMappingURL=ManufacturerServiceImpl.js.map