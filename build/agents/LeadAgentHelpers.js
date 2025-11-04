"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgentHelpers = void 0;
const Constants_1 = require("../common/io/Constants");
const Log_1 = require("../utils/logger/Log");
const RedisCacheUtils_1 = require("../utils/cache/RedisCacheUtils");
const ProcedureExecutor_1 = require("../utils/procedure/ProcedureExecutor");
const logger = (0, Log_1.createLogger)(module);
class LeadAgentHelpers {
    static cacheUtils = RedisCacheUtils_1.RedisCacheUtils.getInstance();
    static async mapStateToDB(stateName, stateMapCache, preferredBuildingId = 1) {
        const cacheKey = `${stateName}:${preferredBuildingId}`;
        const cachedState = stateMapCache.get(cacheKey);
        if (cachedState !== undefined) {
            return cachedState;
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([stateName], "getMapIdByStateName(?)", "getMapIdByStateName");
            if (result?.length > 0) {
                const preferredMapping = result.find((item) => item.building_id === preferredBuildingId);
                const mapping = preferredMapping || result[0];
                const output = {
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
        }
        catch (error) {
            logger.error("[LeadAgentHelpers] State mapping failed:", error);
            stateMapCache.set(cacheKey, null);
            return null;
        }
    }
    static async mapRoofTypeToDB(roofType, mapId, roofMapCache) {
        const normalizedRoofType = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;
        const cachedRoofId = await this.cacheUtils.get(cacheKey);
        if (cachedRoofId) {
            return cachedRoofId;
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapId, roofType], "getRoofIdByType(?, ?)", "roof_mapping");
            if (result?.length > 0) {
                roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        }
        catch (error) {
            logger.error("[LeadAgentHelpers] Roof type mapping failed:", error);
        }
        const fallbackId = Constants_1.Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ??
            (normalizedRoofType.includes("vertical")
                ? 1
                : normalizedRoofType.includes("box")
                    ? 3
                    : 2);
        await this.cacheUtils.put(cacheKey, fallbackId);
        return fallbackId;
    }
    static formatCurrentParams(params) {
        const parts = [];
        if (params.width)
            parts.push(`Width: ${params.width}ft`);
        if (params.length)
            parts.push(`Length: ${params.length}ft`);
        if (params.height)
            parts.push(`Height: ${params.height}ft`);
        if (params.roof_type)
            parts.push(`Roof: ${params.roof_type}`);
        if (params.state_name)
            parts.push(`State: ${params.state_name}`);
        if (params.gauge)
            parts.push(`Gauge: ${params.gauge}`);
        return parts.length > 0 ? `📋 Current parameters: ${parts.join(" | ")}` : "";
    }
    static getMissingFields(params) {
        const missing = [];
        for (const field of Constants_1.Constants.REQUIRED_FIELDS) {
            const value = params[field];
            if (value === null || value === undefined || value === "") {
                missing.push(field);
                logger.info(`[getMissingFields] Field "${field}" is MISSING`);
            }
        }
        logger.info(`[getMissingFields] Total missing: ${missing.length}`);
        return missing;
    }
    static formatFieldName(field) {
        return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
    }
}
exports.LeadAgentHelpers = LeadAgentHelpers;
//# sourceMappingURL=LeadAgentHelpers.js.map