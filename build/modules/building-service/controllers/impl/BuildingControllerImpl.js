"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingControllerImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const Log_1 = require("../../../../utils/logger/Log");
const ServiceResponse_1 = require("../../../../utils/response/ServiceResponse");
const node_http2_1 = require("node:http2");
const BuildingServiceImpl_1 = require("../../../building-service/services/impl/BuildingServiceImpl");
const logger = (0, Log_1.createLogger)(module);
class BuildingControllerImpl {
    static instance;
    service;
    constructor(service, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use BuildingController.getInstance() instead of new.");
        }
        this.service = service;
    }
    static getInstance() {
        if (!BuildingControllerImpl.instance) {
            BuildingControllerImpl.instance = new BuildingControllerImpl(BuildingServiceImpl_1.BuildingServiceImpl.getInstance(), Enforce);
        }
        return BuildingControllerImpl.instance;
    }
    fetchBuildingDataHandler = async (req, res, next) => {
        let building;
        try {
            building = await this.service.fetchBuildingData(req.params);
        }
        catch (error) {
            logger.error(`Error getting building data: ${error.message}`);
            next(error);
            return;
        }
        this.handleSuccessResponse(res, building);
    };
    handleSuccessResponse(res, outcome, pagination = false, status = node_http2_1.constants.HTTP_STATUS_OK) {
        const serviceResponse = new ServiceResponse_1.ServiceResponse(res).setStatus(status);
        serviceResponse.setOutcome(outcome);
        serviceResponse.send();
    }
}
exports.BuildingControllerImpl = BuildingControllerImpl;
function Enforce() {
}
//# sourceMappingURL=BuildingControllerImpl.js.map