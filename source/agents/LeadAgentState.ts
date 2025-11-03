import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { UserFriendlyParams, StateMapping } from "@agents/tools/io/IChat";

export const LeadAgentState = Annotation.Root({
    sessionId: Annotation<string>,

    messages: Annotation<BaseMessage[]>({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    }),

    userFriendlyParams: Annotation<Partial<UserFriendlyParams>>({
        reducer: (current, update) => {
            if (!update) return current;
            return {
                ...current,
                ...update,
            };
        },
        default: () => ({}),
    }),

    hasGarageIntent: Annotation<boolean>({
        value: (_, update) => update ?? false,
        default: () => false,
    }),

    priceCalculated: Annotation<boolean>({
        value: (_, update) => update ?? false,
        default: () => false,
    }),

    currentField: Annotation<keyof UserFriendlyParams | null>({
        value: (_, update) => update ?? null,
        default: () => null,
    }),

    validationError: Annotation<string | null>({
        value: (_, update) => update ?? null,
        default: () => null,
    }),

    stateMapCache: Annotation<Map<string, StateMapping | null>>({
        value: (_, update) => update ?? new Map(),
        default: () => new Map(),
    }),

    roofMapCache: Annotation<Map<string, number>>({
        value: (_, update) => update ?? new Map(),
        default: () => new Map(),
    }),

    pendingUpdates: Annotation<Array<{ field: keyof UserFriendlyParams; value: any }>>({
        reducer: (current, update) => update ?? [],
        default: () => [],
    }),

    response: Annotation<string>({
        value: (_, update) => update ?? "",
        default: () => "",
    }),

    nextStep: Annotation<string | null>({
        value: (_, update) => update ?? null,
        default: () => null,
    }),

    pricingData: Annotation<any>({
        value: (_, update) => update ?? null,
        default: () => null,
    }),

    basePrice: Annotation<number>({
        value: (_, update) => update ?? 0,
        default: () => 0,
    }),

    selectedAddons: Annotation<Array<{ id: string; label: string; cost: number; description: string }>>({
        value: (_, update) => update ?? [],
        default: () => [],
    }),

    finalPrice: Annotation<number>({
        value: (_, update) => update ?? 0,
        default: () => 0,
    }),
});

export type LeadAgentStateType = typeof LeadAgentState.State;
