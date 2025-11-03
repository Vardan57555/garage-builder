import {StateMapping, UserFriendlyParams} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {RedisCacheUtils} from "@utils/cache/RedisCacheUtils";
import {ProcedureExecutor} from "@utils/procedure/ProcedureExecutor";
const logger: pino.Logger = createLogger(module);

export class LeadAgentHelpers {
    private static cacheUtils = RedisCacheUtils.getInstance();

    static async mapStateToDB(
        stateName: string,
        stateMapCache: Map<string, StateMapping | null>,
        preferredBuildingId = 1
    ): Promise<StateMapping | null> {
        const cacheKey = `${stateName}:${preferredBuildingId}`;
        const cachedState = stateMapCache.get(cacheKey);

        if (cachedState !== undefined) {
            return cachedState;
        }

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [stateName],
                "getMapIdByStateName(?)",
                "getMapIdByStateName"
            );

            if (result?.length > 0) {
                const preferredMapping = result.find(
                    (item: any) => item.building_id === preferredBuildingId
                );
                const mapping = preferredMapping || result[0];
                const output: StateMapping = {
                    map_id: mapping.map_id,
                    manufacturer_id: mapping.manufacturer_id,
                };
                await this.cacheUtils.put(cacheKey, output);
                stateMapCache.set(cacheKey, output);
                return output;
            }

            await this.cacheUtils.put(cacheKey, null);
            stateMapCache.set(cacheKey, null);
            return null;
        } catch (error) {
            logger.error("[LeadAgentHelpers] State mapping failed:", error);
            stateMapCache.set(cacheKey, null);
            return null;
        }
    }

    static async mapRoofTypeToDB(
        roofType: string,
        mapId: number,
        roofMapCache: Map<string, number>
    ): Promise<number> {
        const normalizedRoofType: string = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;

        const cachedRoofId: number = await this.cacheUtils.get(cacheKey);
        if (cachedRoofId) {
            return cachedRoofId;
        }

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [mapId, roofType],
                "getRoofIdByType(?, ?)",
                "roof_mapping"
            );

            if (result?.length > 0) {
                roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        } catch (error) {
            logger.error("[LeadAgentHelpers] Roof type mapping failed:", error);
        }

        const fallbackId: number = Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ??
            (normalizedRoofType.includes("vertical")
                ? 1
                : normalizedRoofType.includes("box")
                    ? 3
                    : 2);

        await this.cacheUtils.put(cacheKey, fallbackId);
        return fallbackId;
    }

    static formatCurrentParams(params: Partial<UserFriendlyParams>): string {
        const parts: string[] = [];

        if (params.width) parts.push(`Width: ${params.width}ft`);
        if (params.length) parts.push(`Length: ${params.length}ft`);
        if (params.height) parts.push(`Height: ${params.height}ft`);
        if (params.roof_type) parts.push(`Roof: ${params.roof_type}`);
        if (params.state_name) parts.push(`State: ${params.state_name}`);
        if (params.gauge) parts.push(`Gauge: ${params.gauge}`);

        return parts.length > 0 ? `📋 Current parameters: ${parts.join(" | ")}` : "";
    }

    static getMissingFields(params: Partial<UserFriendlyParams>): string[] {

        const missing: string[] = [];

        for (const field of Constants.REQUIRED_FIELDS) {
            const value = params[field as keyof UserFriendlyParams];

            // If field is empty/null/undefined, it's MISSING
            if (value === null || value === undefined || value === "") {
                missing.push(field);
                logger.info(`[getMissingFields] Field "${field}" is MISSING`);
            }
        }

        logger.info(`[getMissingFields] Total missing: ${missing.length}`);
        return missing;
    }

    static formatFieldName(field: keyof UserFriendlyParams): string {
        return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
    }
}
