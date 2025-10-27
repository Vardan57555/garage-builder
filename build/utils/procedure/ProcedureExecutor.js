"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcedureExecutor = void 0;
const sequelize_1 = require("sequelize");
const MySqlManager_1 = require("../../config/db/MySqlManager");
const Log_1 = require("../logger/Log");
const logger = (0, Log_1.createLogger)(module);
class ProcedureExecutor {
    static async getProcedureData(params, procedure, key) {
        const sequelize = MySqlManager_1.MySQLManager.getInstance().sequelize;
        const queryParams = Array.isArray(params) ? params : [params];
        logger.info(`[ProcedureExecutor] Executing procedure: ${procedure}`);
        logger.info(`[ProcedureExecutor] Params count: ${queryParams.length}`);
        logger.info(`[ProcedureExecutor] Params:`, queryParams);
        try {
            let callQuery;
            let replacements;
            if (!procedure.includes('(')) {
                const placeholders = queryParams.map(() => '?').join(',');
                callQuery = `CALL ${procedure}(${placeholders})`;
                replacements = queryParams;
                logger.info(`[ProcedureExecutor] Procedure is bare name. Built placeholders: ${placeholders}`);
                logger.info(`[ProcedureExecutor] Final query: ${callQuery}`);
            }
            else if (procedure.includes('(') && procedure.includes('?')) {
                const placeholderCount = (procedure.match(/\?/g) || []).length;
                logger.info(`[ProcedureExecutor] Procedure has placeholders. Count: ${placeholderCount}`);
                logger.info(`[ProcedureExecutor] Provided params: ${queryParams.length}`);
                const filteredParams = queryParams
                    .filter(p => p !== undefined)
                    .slice(0, placeholderCount);
                if (filteredParams.length !== placeholderCount) {
                    logger.warn(`[ProcedureExecutor] Parameter count mismatch! Expected ${placeholderCount}, got ${filteredParams.length}`);
                }
                callQuery = `CALL ${procedure}`;
                replacements = filteredParams;
                logger.info(`[ProcedureExecutor] Final query: ${callQuery}`);
                logger.info(`[ProcedureExecutor] Final replacements:`, replacements);
            }
            else if (procedure.includes('(') && !procedure.includes('?')) {
                callQuery = procedure.includes('CALL') ? procedure : `CALL ${procedure}`;
                replacements = [];
                logger.info(`[ProcedureExecutor] Procedure has no placeholders`);
                logger.info(`[ProcedureExecutor] Final query: ${callQuery}`);
            }
            else {
                logger.error(`[ProcedureExecutor] Invalid procedure format: ${procedure}`);
                return [];
            }
            const data = await sequelize.query(callQuery, {
                replacements,
                type: sequelize_1.QueryTypes.RAW
            });
            logger.info(`[ProcedureExecutor] Query executed successfully`);
            logger.info(`[ProcedureExecutor] Response type:`, Array.isArray(data) ? 'array' : typeof data);
            let rows = [];
            if (Array.isArray(data)) {
                if (data.length > 0 && Array.isArray(data[0])) {
                    rows = data[0];
                    logger.info(`[ProcedureExecutor] Extracted rows from data[0]: ${rows.length} rows`);
                }
                else if (data.length > 0) {
                    rows = data;
                    logger.info(`[ProcedureExecutor] Using data directly: ${rows.length} rows`);
                }
                else {
                    rows = [];
                    logger.warn(`[ProcedureExecutor] Empty result set`);
                }
            }
            else {
                rows = [];
                logger.warn(`[ProcedureExecutor] Unexpected response format`);
            }
            logger.info(`[ProcedureExecutor] Prepared ${rows.length} rows for key: ${key}`);
            return ProcedureExecutor.prepareQueryResult(key, rows);
        }
        catch (error) {
            logger.error(`[ProcedureExecutor] Error executing procedure ${procedure}:`, error);
            const defaultResult = ProcedureExecutor.prepareQueryResult(key, []);
            logger.warn(`[ProcedureExecutor] Returning default/empty result for key: ${key}`);
            return defaultResult;
        }
    }
    static prepareQueryResult(key, data) {
        if (!key) {
            return data;
        }
        if (data.length > 0) {
            if (key === "building_structure") {
                return data.map((record) => ({
                    ...record,
                    conditions: record.conditions ? JSON.parse(record.conditions) : {},
                }));
            }
            return data;
        }
        const defaultDataMap = {
            base: [
                { id: 0, structure: 0, map_id: 0, regular_cost: 0, box_style_cost: 0, vertical_roof_cost: 0, gauge: 12 },
                { id: 0, structure: 0, map_id: 0, regular_cost: 0, box_style_cost: 0, vertical_roof_cost: 0, gauge: 14 },
            ],
            building_structure: [
                {
                    min_width: 12,
                    start_length: 12,
                    min_height: 8,
                    end_length: 60,
                    distance_on_center: 24,
                    conditions: {}
                }
            ],
            full_length_side: [ProcedureExecutor.createDefaultSide()],
            side: [ProcedureExecutor.createDefaultSide()],
            side_slope_height: [ProcedureExecutor.createDefaultSide()],
            utility_side: [ProcedureExecutor.createDefaultSide()],
            utility_slope_height: [ProcedureExecutor.createDefaultSide()],
            central_side_full_length: [ProcedureExecutor.createDefaultSide()],
            central_side: [ProcedureExecutor.createDefaultSide()],
            end: [ProcedureExecutor.createDefaultEnd()],
            central_end: [ProcedureExecutor.createDefaultEnd()],
            anchors_cost: [],
            bows: [],
            addons: [],
            addons_width: [],
            braces: [],
            trusses: [],
            trusses_slope: [],
            certificate: [],
            end_cross_bracing: [],
            insulation: [],
            full_length_panel: [],
            side_cross_bracing: [],
            roof_pitch: [],
            connection_fees: [],
            garage_door: [],
            garage_door_frameout: [],
            walkin_door_frameout: [],
            window_frameout: [],
            truss_name: [],
            manufacturer: [],
            gable_end: [],
            delux_two_tone: [],
            additional_features: [],
            cupola: [],
            canopy: [],
        };
        const defaultValue = defaultDataMap[key] ?? [];
        logger.info(`[ProcedureExecutor] Returning default value for key '${key}': ${defaultValue.length} items`);
        return defaultValue;
    }
    static createDefaultSide() {
        return {
            id: 0, map_id: 0, length: 0, height: 0,
            leg_height_cost: 0, leg_height_cost_12: 0,
            side_close_cost: 0, vertical_side_cost: 0,
            double_leg_baserail_cost: 0, double_leg_baserail_cost_12: 0,
            half_side_close_cost: 0, half_vertical_side_cost: 0,
            one_fourth_side_close_cost: 0, one_fourth_vertical_side_cost: 0,
            three_fourth_side_close_cost: 0, three_fourth_vertical_side_cost: 0,
            lift_type: "", lifttype_price: 0
        };
    }
    static createDefaultEnd() {
        return {
            id: 0, map_id: 0, width: 0, height: 0,
            end_close_cost: 0, certified_end_cost: 0,
            vertical_ends_cost: 0, half_end_close_cost: 0,
            half_vertical_ends_cost: 0, one_fourth_end_close_cost: 0,
            one_fourth_vertical_ends_cost: 0, three_fourth_end_close_cost: 0,
            three_fourth_vertical_ends_cost: 0,
        };
    }
}
exports.ProcedureExecutor = ProcedureExecutor;
//# sourceMappingURL=ProcedureExecutor.js.map