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
     *
     * Handles multiple procedure format:
     * 1. 'getTrussName(?)' - with placeholders
     * 2. 'getBuildingStructure' - just name, needs to build placeholders
     * 3. 'CALL getTrussName(?)' - already has CALL
     *
     * @param params Parameters for the stored procedure.
     * @param procedure Name of the stored procedure
     * @param key Optional key to process/transform the result.
     */

    public static async getProcedureData<T>(params: any[] | any, procedure: string, key?: string): Promise<T[]>
    {
        const sequelize: Sequelize = MySQLManager.getInstance().sequelize;

        // Ensure params is always an array
        const queryParams = Array.isArray(params) ? params : [params];

        logger.info(`[ProcedureExecutor] Executing procedure: ${procedure}`);
        logger.info(`[ProcedureExecutor] Params count: ${queryParams.length}`);
        logger.info(`[ProcedureExecutor] Params:`, queryParams);

        try
        {
            let callQuery: string;
            let replacements: any[];

            // FIX 1: Handle procedure name without parentheses
            if (!procedure.includes('('))
            {
                // Just a procedure name like 'getBuildingStructure'
                // Build placeholders based on actual params
                const placeholders = queryParams.map(() => '?').join(',');
                callQuery = `CALL ${procedure}(${placeholders})`;
                replacements = queryParams;

                logger.info(`[ProcedureExecutor] Procedure is bare name. Built placeholders: ${placeholders}`);
                logger.info(`[ProcedureExecutor] Final query: ${callQuery}`);
            }
            else if (procedure.includes('(') && procedure.includes('?'))
            {
                // Procedure string already has parameters like: 'getTrussName(?)' or 'getPrice(?, ?, ?)'
                // Count the actual placeholders needed
                const placeholderCount = (procedure.match(/\?/g) || []).length;

                logger.info(`[ProcedureExecutor] Procedure has placeholders. Count: ${placeholderCount}`);
                logger.info(`[ProcedureExecutor] Provided params: ${queryParams.length}`);

                // FIX 2: Filter out undefined values and only keep needed params
                const filteredParams = queryParams
                    .filter(p => p !== undefined)
                    .slice(0, placeholderCount);

                if (filteredParams.length !== placeholderCount)
                {
                    logger.warn(`[ProcedureExecutor] Parameter count mismatch! Expected ${placeholderCount}, got ${filteredParams.length}`);
                }

                callQuery = `CALL ${procedure}`;
                replacements = filteredParams;

                logger.info(`[ProcedureExecutor] Final query: ${callQuery}`);
                logger.info(`[ProcedureExecutor] Final replacements:`, replacements);
            }
            else if (procedure.includes('(') && !procedure.includes('?'))
            {
                // Procedure has parentheses but no placeholders like: 'getTrussName()'
                callQuery = procedure.includes('CALL') ? procedure : `CALL ${procedure}`;
                replacements = [];

                logger.info(`[ProcedureExecutor] Procedure has no placeholders`);
                logger.info(`[ProcedureExecutor] Final query: ${callQuery}`);
            }
            else
            {
                // Should not happen
                logger.error(`[ProcedureExecutor] Invalid procedure format: ${procedure}`);
                return [];
            }

            // Execute the query
            const data = await sequelize.query(callQuery, {
                replacements,
                type: QueryTypes.RAW
            }) as any;

            logger.info(`[ProcedureExecutor] Query executed successfully`);
            logger.info(`[ProcedureExecutor] Response type:`, Array.isArray(data) ? 'array' : typeof data);

            // FIX 3: Properly extract rows from Sequelize response
            let rows: any[] = [];

            if (Array.isArray(data))
            {
                // Sequelize returns [[rows], metadata] or [rows]
                if (data.length > 0 && Array.isArray(data[0]))
                {
                    rows = data[0];
                    logger.info(`[ProcedureExecutor] Extracted rows from data[0]: ${rows.length} rows`);
                }
                else if (data.length > 0)
                {
                    rows = data;
                    logger.info(`[ProcedureExecutor] Using data directly: ${rows.length} rows`);
                }
                else
                {
                    rows = [];
                    logger.warn(`[ProcedureExecutor] Empty result set`);
                }
            }
            else
            {
                rows = [];
                logger.warn(`[ProcedureExecutor] Unexpected response format`);
            }

            logger.info(`[ProcedureExecutor] Prepared ${rows.length} rows for key: ${key}`);

            // Process and return the result
            return ProcedureExecutor.prepareQueryResult(key, rows) as T[];
        }
        catch (error)
        {
            logger.error(`[ProcedureExecutor] Error executing procedure ${procedure}:`, error);

            // Return empty array with default values instead of throwing
            const defaultResult = ProcedureExecutor.prepareQueryResult(key, []);
            logger.warn(`[ProcedureExecutor] Returning default/empty result for key: ${key}`);
            return defaultResult as T[];
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
            return data;
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

        // FIX 4: Return appropriate defaults when data is empty
        const defaultDataMap: Record<string, any[]> = {
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
            // Add other common empty results
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
