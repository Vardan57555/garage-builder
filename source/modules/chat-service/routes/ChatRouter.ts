import { CustomRouter } from "@utils/router/CustomRouter";
import { InstantiationError } from "@errors/InstantiationError";
import { ChatController } from "@modules/chat-service/controllers/ChatController";
import { ChatControllerImpl } from "@modules/chat-service/controllers/impl/ChatControllerImpl";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

export class ChatRouter extends CustomRouter {
    private static instance: ChatRouter;
    private readonly controller: ChatController;

    constructor(controller: ChatController, enforce: () => void) {
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Error: Instantiation failed: Use ChatRouter.getInstance() instead of new."
            );
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
        logger.info("[ChatRouter] Router initialized");
    }

    public static getInstance(): ChatRouter {
        if (!ChatRouter.instance) {
            ChatRouter.instance = new ChatRouter(ChatControllerImpl.getInstance(), Enforce);
        }
        return ChatRouter.instance;
    }

    /**
     * Initialize all chat-related routes
     * Defines endpoints and their corresponding handlers
     */
    private initializeRoutes(): void
    {
        this.route("/")
            .post(this.controller.fetchBuildingPricingWithUtilityHandler);

        this.route("/end")
            .post(this.controller.endSessionHandler);
    }
}

function Enforce(): void {}
