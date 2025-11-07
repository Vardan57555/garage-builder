"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgentState = void 0;
const langgraph_1 = require("@langchain/langgraph");
exports.LeadAgentState = langgraph_1.Annotation.Root({
    sessionId: (langgraph_1.Annotation),
    messages: (0, langgraph_1.Annotation)({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    }),
    userFriendlyParams: (0, langgraph_1.Annotation)({
        reducer: (current, update) => {
            if (!update)
                return current;
            return {
                ...current,
                ...update,
            };
        },
        default: () => ({}),
    }),
    hasGarageIntent: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? false,
        default: () => false,
    }),
    priceCalculated: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? false,
        default: () => false,
    }),
    currentField: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? null,
        default: () => null,
    }),
    validationError: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? null,
        default: () => null,
    }),
    stateMapCache: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? new Map(),
        default: () => new Map(),
    }),
    roofMapCache: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? new Map(),
        default: () => new Map(),
    }),
    pendingUpdates: (0, langgraph_1.Annotation)({
        reducer: (current, update) => update ?? [],
        default: () => [],
    }),
    response: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? "",
        default: () => "",
    }),
    nextStep: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? null,
        default: () => null,
    }),
    pricingData: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? null,
        default: () => null,
    }),
    basePrice: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? 0,
        default: () => 0,
    }),
    selectedAddons: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? [],
        default: () => [],
    }),
    finalPrice: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? 0,
        default: () => 0,
    }),
    generatedImageUrl: (0, langgraph_1.Annotation)({
        value: (_, update) => update ?? null,
        default: () => null,
    }),
});
//# sourceMappingURL=LeadAgentState.js.map