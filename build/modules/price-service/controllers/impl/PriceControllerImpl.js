"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceControllerImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ServiceResponse_1 = require("../../../../utils/response/ServiceResponse");
const node_http2_1 = require("node:http2");
const PriceServiceImpl_1 = require("../../../price-service/services/impl/PriceServiceImpl");
class PriceControllerImpl {
    static instance;
    service;
    constructor(service, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceController.getInstance() instead of new.");
        }
        this.service = service;
    }
    static getInstance() {
        if (!PriceControllerImpl.instance) {
            PriceControllerImpl.instance = new PriceControllerImpl(PriceServiceImpl_1.PriceServiceImpl.getInstance(), Enforce);
        }
        return PriceControllerImpl.instance;
    }
    fetchAllPricesHandler = async (req, res, next) => {
        let prices;
        try {
            prices = this.service.fetchAllPrices(req.body);
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, prices);
    };
    handleSuccessResponse(res, outcome, pagination = false, status = node_http2_1.constants.HTTP_STATUS_OK) {
        const serviceResponse = new ServiceResponse_1.ServiceResponse(res).setStatus(status);
        serviceResponse.setOutcome(outcome);
        serviceResponse.send();
    }
}
exports.PriceControllerImpl = PriceControllerImpl;
function Enforce() { }
//# sourceMappingURL=PriceControllerImpl.js.map