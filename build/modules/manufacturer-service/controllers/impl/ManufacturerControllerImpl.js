"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturerControllerImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ServiceResponse_1 = require("../../../../utils/response/ServiceResponse");
const node_http2_1 = require("node:http2");
const ManufacturerServiceImpl_1 = require("../../../manufacturer-service/service/impl/ManufacturerServiceImpl");
class ManufacturerControllerImpl {
    static instance;
    service;
    constructor(service, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateController.getInstance() instead of new.");
        }
        this.service = service;
    }
    static getInstance() {
        if (!ManufacturerControllerImpl.instance) {
            ManufacturerControllerImpl.instance = new ManufacturerControllerImpl(ManufacturerServiceImpl_1.ManufacturerServiceImpl.getInstance(), Enforce);
        }
        return ManufacturerControllerImpl.instance;
    }
    fetchAllHandler = async (req, res, next) => {
        let manufactures;
        try {
            manufactures = await this.service.fetchAll();
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, manufactures);
    };
    fetchManufacturerByStateHandler = async (req, res, next) => {
        let manufacturer;
        try {
            manufacturer = await this.service.fetchManufacturerByState(req.params);
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, manufacturer);
    };
    handleSuccessResponse(res, outcome, pagination = false, status = node_http2_1.constants.HTTP_STATUS_OK) {
        const serviceResponse = new ServiceResponse_1.ServiceResponse(res).setStatus(status);
        serviceResponse.setOutcome(outcome);
        serviceResponse.send();
    }
}
exports.ManufacturerControllerImpl = ManufacturerControllerImpl;
function Enforce() {
}
//# sourceMappingURL=ManufacturerControllerImpl.js.map