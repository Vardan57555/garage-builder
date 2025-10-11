"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateControllerImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ServiceResponse_1 = require("../../../../utils/response/ServiceResponse");
const node_http2_1 = require("node:http2");
const StateServiceImpl_1 = require("../../../states-service/services/impl/StateServiceImpl");
class StateControllerImpl {
    static instance;
    service;
    constructor(service, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateController.getInstance() instead of new.");
        }
        this.service = service;
    }
    static getInstance() {
        if (!StateControllerImpl.instance) {
            StateControllerImpl.instance = new StateControllerImpl(StateServiceImpl_1.StateServiceImpl.getInstance(), Enforce);
        }
        return StateControllerImpl.instance;
    }
    fetchAllHandler = async (req, res, next) => {
        let states;
        try {
            states = await this.service.fetchAll();
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, states);
    };
    fetchByManufacturerIdHandler = async (req, res, next) => {
        let states;
        try {
            states = await this.service.fetchByManufacturerId(req.params);
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, states);
    };
    handleSuccessResponse(res, outcome, pagination = false, status = node_http2_1.constants.HTTP_STATUS_OK) {
        const serviceResponse = new ServiceResponse_1.ServiceResponse(res).setStatus(status);
        serviceResponse.setOutcome(outcome);
        serviceResponse.send();
    }
}
exports.StateControllerImpl = StateControllerImpl;
function Enforce() {
}
//# sourceMappingURL=StateControllerImpl.js.map