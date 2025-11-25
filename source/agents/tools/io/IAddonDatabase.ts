export interface AddonFromDB {
    id: string;
    name: string;
    label: string;
    type: string;
    cost: number;
    description?: string;
    category?: string;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}
