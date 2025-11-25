/**
 * Response structure for color selection node
 */
export interface ColorNodeResponse {
    response?: string;
    userFriendlyParams: Record<string, any>;
    currentField?: string;
    colorOptions?: ColorOption[];
    nextStep: string;
}

/**
 * Color display entry with formatting
 */
export interface ColorDisplayEntry {
    index: number;
    category: string;
    color: ColorOption;
    display: string;
}


export interface ColorOption {
    id: number;
    name: string;
    hex_value: string;
    red_value: number;
    green_value: number;
    blue_value: number;
    cost: number;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export interface DataSource {
    name: string;
    query: string;
    context: string;
}
