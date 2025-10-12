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
        const sanitizedParams = queryParams.map(p => (p === undefined || p === null ? null : p));
        const placeholders = sanitizedParams.map(() => '?').join(',');
        const callQuery = procedure.includes('(') ? `CALL ${procedure}` : `CALL ${procedure}(${placeholders})`;
        try {
            const data = await sequelize.query(callQuery, {
                replacements: sanitizedParams,
                type: sequelize_1.QueryTypes.RAW
            });
            const rows = Array.isArray(data?.[0]) ? data[0] : data;
            return ProcedureExecutor.prepareQueryResult(key, rows);
        }
        catch (error) {
            logger.error(`Error executing procedure ${procedure}:`, error);
            throw error;
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
            full_length_side: [ProcedureExecutor.createDefaultSide()],
            side: [ProcedureExecutor.createDefaultSide()],
            side_slope_height: [ProcedureExecutor.createDefaultSide()],
            utility_side: [ProcedureExecutor.createDefaultSide()],
            utility_slope_height: [ProcedureExecutor.createDefaultSide()],
            central_side_full_length: [ProcedureExecutor.createDefaultSide()],
            central_side: [ProcedureExecutor.createDefaultSide()],
            end: [ProcedureExecutor.createDefaultEnd()],
            central_end: [ProcedureExecutor.createDefaultEnd()],
        };
        return defaultDataMap[key] ?? [];
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