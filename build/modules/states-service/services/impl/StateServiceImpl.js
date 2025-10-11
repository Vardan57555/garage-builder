"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateServiceImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const State_1 = __importDefault(require("../../../../config/db/models/State"));
const ServerError_1 = require("../../../../errors/ServerError");
const StateManufacturerBuildingMapping_1 = __importDefault(require("../../../../config/db/models/StateManufacturerBuildingMapping"));
const ResponseTypes_1 = require("../../../../common/io/enum/ResponseTypes");
const ValidationError_1 = require("../../../../errors/ValidationError");
const StateDataValidator_1 = require("../../../states-service/services/validator/StateDataValidator");
class StateServiceImpl {
    static instance;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateService.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!StateServiceImpl.instance) {
            StateServiceImpl.instance = new StateServiceImpl(Enforce);
        }
        return StateServiceImpl.instance;
    }
    async fetchAll() {
        let states;
        try {
            states = await State_1.default.findAll();
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to get all states with error:  ${error.message}`);
        }
        return this.validateOutput(states, ResponseTypes_1.ValidationTypes.ALL);
    }
    async fetchByManufacturerId(body) {
        let { manufacturer_id } = body;
        let states;
        try {
            states = await State_1.default.findAll({
                include: [
                    {
                        model: StateManufacturerBuildingMapping_1.default,
                        required: true,
                        where: { manufacturer_id },
                        attributes: [],
                    },
                ],
                group: ["State.state_id"],
                order: [["name", "ASC"]],
            });
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to get all states with error:  ${error.message}`);
        }
        if (!states.length) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.NOT_FOUND, `State with ID ${manufacturer_id} does not exist`);
        }
        return this.validateOutput(states, ResponseTypes_1.ValidationTypes.ALL);
    }
    validateOutput(state, type = ResponseTypes_1.ValidationTypes.SINGLE) {
        const validationMethods = {
            [ResponseTypes_1.ValidationTypes.SINGLE]: StateDataValidator_1.StateDataValidator.outputValidate,
            [ResponseTypes_1.ValidationTypes.ALL]: StateDataValidator_1.StateDataValidator.outputArrayValidate
        };
        const outputValidation = validationMethods[type](state);
        if (outputValidation.error) {
            throw new ValidationError_1.ValidationError(ValidationError_1.ValidationError.OUTPUT, outputValidation.error.message);
        }
        return outputValidation.value;
    }
}
exports.StateServiceImpl = StateServiceImpl;
function Enforce() {
}
//# sourceMappingURL=StateServiceImpl.js.map