import { QueryTypes } from "sequelize";
import {MySQLManager} from "@config/db/MySqlManager";
import {Sequelize} from "sequelize-typescript";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class ProcedureExecutor
{
    /**
     * Executes a stored procedure and returns the result.
     * @param params Parameters for the stored procedure.
     * @param procedure Name of the stored procedure.
     * @param key Optional key to process/transform the result.
     */

    public static async getProcedureData<T>(params: any[] | any, procedure: string, key?: string): Promise<T[]>
    {
        const sequelize: Sequelize = MySQLManager.getInstance().sequelize;
        const queryParams = Array.isArray(params) ? params : [params];

        const sanitizedParams = queryParams.map(p => (p === undefined || p === null ? null : p));

        const placeholders: string = sanitizedParams.map(() => '?').join(',');

        const callQuery: string = procedure.includes('(') ? `CALL ${procedure}` : `CALL ${procedure}(${placeholders})`;

        try
        {
            const data = await sequelize.query(callQuery, {
                replacements: sanitizedParams,
                type: QueryTypes.RAW
            }) as any;

            const rows = Array.isArray(data?.[0]) ? data[0] : data;
            return ProcedureExecutor.prepareQueryResult(key, rows) as T[];
        }
        catch (error)
        {
            logger.error(`Error executing procedure ${procedure}: ${error}`);
            throw error;
        }
    }

    /**
     * @param key Optional key to determine how to process or transform the data.
     * @param data The array of query result objects to be processed.
     * @returns The processed array of objects, either transformed or defaulted.
     */

    public static prepareQueryResult(key: string | undefined, data: any[]): any[]
    {
        if (!key)
        {
            return data
        }

        if (data.length > 0)
        {
            if (key === "building_structure")
            {
                return data.map((record) => ({
                    ...record,
                    conditions: record.conditions ? JSON.parse(record.conditions) : {},
                }));
            }

            return data;
        }

        const defaultDataMap: Record<string, any[]> = {
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

    /**
     * @returns An object representing the default side configuration.
     */

    private static createDefaultSide()
    {
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

    /**
     * @returns An object representing the default end configuration.
     */

    private static createDefaultEnd()
    {
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
