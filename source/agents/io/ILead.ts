import {UserFriendlyParams} from "@agents/tools/io/IChat";

export interface Session {
    memory: {
        chatHistory: {
            addUserMessage: (message: string) => Promise<void>;
            addAIChatMessage: (message: string) => Promise<void>;
            getMessages: () => Promise<any[]>;
        };
    };
    state: SessionState;
    stateMapCache?: Map<any, any>;
    roofMapCache?: Map<any, any>;
}

export interface SessionState {
    userFriendlyParams: Partial<UserFriendlyParams>;
    hasGarageIntent: boolean;
    priceCalculated: boolean;
    currentField?: string | null;
    pricingData?: any | null;
    basePrice: number;
    selectedAddons: Addon[];
    finalPrice: number;
    color: string | null;
    colorCost: number;
}

export type HandlerFunction = (
    session: Session,
    sessionId: string,
    input: string,
    originalDimensions: DimensionSnapshot
) => Promise<string>;

export interface UserIntent {
    isEmpty: boolean;
    isSkipping: boolean;
    isColorChange: boolean;
    isAddonRequest: boolean;
}

export interface DimensionSnapshot {
    width?: number;
    length?: number;
    height?: number;
}

export interface UpdateResult {
    success: boolean;
    message: string;
    updatedParams?: Partial<UserFriendlyParams>;
}

export interface ColorOption {
    name: string;
    cost: number;
    category?: string;
}

export interface Addon {
    id: string;
    name: string;
    cost: number;
    quantity?: number;
}
