"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatControllerImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ServiceResponse_1 = require("../../../../utils/response/ServiceResponse");
const node_http2_1 = require("node:http2");
const ChatServiceImpl_1 = require("../../../chat-service/services/impl/ChatServiceImpl");
const ServerError_1 = require("../../../../errors/ServerError");
class ChatControllerImpl {
    static instance;
    service;
    constructor(service, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ChatController.getInstance() instead of new.");
        }
        this.service = service;
    }
    static getInstance() {
        if (!ChatControllerImpl.instance) {
            ChatControllerImpl.instance = new ChatControllerImpl(ChatServiceImpl_1.ChatServiceImpl.getInstance(), Enforce);
        }
        return ChatControllerImpl.instance;
    }
    fetchBuildingPricingWithUtilityHandler = async (req, res, next) => {
        let pricesWithUtility;
        try {
            const clientIp = this.getClientIp(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            pricesWithUtility = await this.service.generateAssistantResponse(req.body, clientIp, userAgent);
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, pricesWithUtility);
    };
    endSessionHandler = async (req, res, next) => {
        let result;
        const { sessionId } = req.body;
        if (!sessionId) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, "sessionId is required to end a session");
        }
        try {
            result = await this.service.endSession(sessionId);
        }
        catch (error) {
            next(error);
            return;
        }
        this.handleSuccessResponse(res, result);
    };
    getClientIp(req) {
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            const ips = Array.isArray(xForwardedFor)
                ? xForwardedFor[0]
                : xForwardedFor.split(',')[0];
            return ips.trim();
        }
        return req.ip || 'unknown';
    }
    handleSuccessResponse(res, outcome, pagination = false, status = node_http2_1.constants.HTTP_STATUS_OK) {
        const serviceResponse = new ServiceResponse_1.ServiceResponse(res).setStatus(status);
        serviceResponse.setOutcome(outcome);
        serviceResponse.send();
    }
}
exports.ChatControllerImpl = ChatControllerImpl;
function Enforce() {
}
//# sourceMappingURL=ChatControllerImpl.js.map