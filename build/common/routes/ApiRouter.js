"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRouter = void 0;
const InstantiationError_1 = require("../../errors/InstantiationError");
const CustomRouter_1 = require("../../utils/router/CustomRouter");
const BuildingRouter_1 = require("../../modules/building-service/routes/BuildingRouter");
const StateRouter_1 = require("../../modules/states-service/routes/StateRouter");
const ManufacturerRouter_1 = require("../../modules/manufacturer-service/routes/ManufacturerRouter");
const PriceRouter_1 = require("../../modules/price-service/routes/PriceRouter");
const ChatRouter_1 = require("../../modules/chat-service/routes/ChatRouter");
class ApiRouter extends CustomRouter_1.CustomRouter {
    static instance;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ApiRouter.getInstance() instead of new.");
        }
        super();
        this.use("/building", BuildingRouter_1.BuildingRouter.getInstance());
        this.use("/state", StateRouter_1.StateRouter.getInstance());
        this.use("/manufacturer", ManufacturerRouter_1.ManufacturerRouter.getInstance());
        this.use("/price", PriceRouter_1.PriceRouter.getInstance());
        this.use("/chat", ChatRouter_1.ChatRouter.getInstance());
    }
    static getInstance() {
        if (!ApiRouter.instance) {
            ApiRouter.instance = new ApiRouter(Enforce);
        }
        return ApiRouter.instance;
    }
}
exports.ApiRouter = ApiRouter;
function Enforce() {
}
//# sourceMappingURL=ApiRouter.js.map