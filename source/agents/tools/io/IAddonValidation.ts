import {AddonFromDB} from "@agents/tools/io/IAddonDatabase";

/**
 * Test result with metadata for reporting
 */
export interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    duration?: number;
}

/**
 * Validation context carrying aggregated addon data and statistics
 */
export interface ValidationContext {
    allAddons: AddonFromDB[];
    limitedAddons: AddonFromDB[];
    typeDistribution: Map<string, number>;
    pricedAddons: AddonFromDB[];
    zeroCostAddons: AddonFromDB[];
}
