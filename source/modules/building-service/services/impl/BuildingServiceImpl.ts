import { BuildingService } from '../BuildingService';
import { InstantiationError } from "@errors/InstantiationError";
import { ServerError } from "@errors/ServerError";
import { IBuildingData } from "@modules/building-service/services/io/IBuildingData";
import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import { IBuildingDetail } from "@modules/building-service/services/io/IBuildingDetail";
import { IBuildingMappingItem, IGetBuildingData } from "@modules/building-service/services/io/IBuildingMapping";
import { IHeightData, IOutputEntry } from "@modules/building-service/services/io/IHeightData";
import { StateIds } from "@modules/building-service/services/io/IStateIds";
import { ManufacturerIds } from "@modules/building-service/services/io/IManufacturerIds";
import { BuildingIdsToRemove } from "@modules/building-service/services/io/BuildingIdsToRemove";
import { BuildingIdSelection } from "@modules/building-service/services/io/BuildingIdSelection";
import { IDrawingGroup, IDrawingItem } from "@modules/building-service/services/io/IDrawing";


export class BuildingServiceImpl implements BuildingService
{
    /**
     * The singleton instance of `BuildingController`.
     * @private
     */

    private static instance: BuildingService;

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void )
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use BuildingService.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of BuildingService.
     *
     * @returns The singleton instance of BuildingService.
     */

    public static getInstance(): BuildingService
    {
        if(!BuildingServiceImpl.instance)
        {
            BuildingServiceImpl.instance = new BuildingServiceImpl(Enforce);
        }

        return BuildingServiceImpl.instance;
    }

    /**
     * Gets all buildings data with the specified options.
     *
     * @param params - The pagination parameters.
     * @returns An array of all building data.
     * @throws ServerError if building data retrieval fails.
     */
    public async fetchBuildingData(params: IGetBuildingData): Promise<IBuildingData>
    {
        const { state_id, manufacturer_id } = params;
        let buildingMapping: IBuildingMappingItem[];

        try
        {
            buildingMapping = await ProcedureExecutor.getProcedureData<IBuildingMappingItem>(
                [state_id, manufacturer_id],
                "getBuildingMappingData(?, ?)",
                "window_frameout"
            );
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to fetch building mapping data: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (!Array.isArray(buildingMapping) || buildingMapping.length === 0)
        {
            throw new ServerError(ServerError.NOT_FOUND, "No building mapping found");
        }

        try
        {
            const mapIds: number[] = buildingMapping.map((d) => Number(d.map_id));
            const leanToIds: number[] = buildingMapping.filter((d) => d.type_of_building === 2).map((d) => Number(d.map_id));

            const mapIdsString: string = this.wrapIdsForSql(mapIds);
            const leanToIdsString: string = this.wrapIdsForSql(leanToIds);

            const [
                allRoofStyle,
                allTrussName,
                legHeightRaw,
                drawingRaw,
                gableMappingRaw,
                leanToRoofPitch,
                sideEndDetails,
                customSizeStatus,
            ] = await Promise.all([
                ProcedureExecutor.getProcedureData([mapIdsString, manufacturer_id], "getAllRoofStyle(?, ?)", ""),
                ProcedureExecutor.getProcedureData([mapIdsString], "getTrussName(?)", ""),
                ProcedureExecutor.getProcedureData([mapIdsString], "getNewLegheightMinMax(?)", ""),
                ProcedureExecutor.getProcedureData([mapIdsString], "getDrawings(?)", ""),
                ProcedureExecutor.getProcedureData([mapIdsString], "getAllGableMapping(?)", ""),
                ProcedureExecutor.getProcedureData([leanToIdsString], "getAllLeanToRoofPitch(?)", ""),
                ProcedureExecutor.getProcedureData([mapIdsString], "getSideEndDetails(?)", ""),
                ProcedureExecutor.getProcedureData([mapIdsString], "getCustomSizeStatus(?)", ""),
            ]);

            const legHeightPrepared: IOutputEntry[] = this.prepareNewLegHeightMinMaxHeight(legHeightRaw);

            if (!this.isDrawingItemArray(drawingRaw))
            {
                throw new ServerError(ServerError.INTERNAL, "Invalid drawing data from DB");
            }

            const drawingsPrepared: IDrawingGroup[] = this.prepareDrawingData(drawingRaw);


            const buildings: IBuildingDetail[] = buildingMapping.map((b) =>
                this.buildBuildingAggregate(
                    b,
                    allRoofStyle,
                    allTrussName,
                    legHeightPrepared,
                    drawingsPrepared,
                    gableMappingRaw,
                    sideEndDetails,
                    leanToRoofPitch,
                    customSizeStatus
                )
            );

            const [
                defaultBuildingRaw,
                colors,
                garageDoorColor,
                manufactureData,
                popularColors,
            ] = await Promise.all([
                ProcedureExecutor.getProcedureData([state_id, manufacturer_id], "getDefaultBuilding(?, ?)", "default_building"),
                ProcedureExecutor.getProcedureData([manufacturer_id], "getColor(?)", "color"),
                ProcedureExecutor.getProcedureData([manufacturer_id], "getGarageDoorColor(?)", "garageDoorColor"),
                ProcedureExecutor.getProcedureData([manufacturer_id], "getManufactureData(?)", "manufacture_data"),
                ProcedureExecutor.getProcedureData([manufacturer_id], "getPopularColors(?)", "popular_colors"),
            ]);

            const defaultBuilding = this.prepareDefaultBuildingData(defaultBuildingRaw, manufacturer_id, state_id);
            const colorObject: Record<number, any> = this.buildColorObject(colors);

            return {
                building: buildings,
                color: colors,
                color_object: colorObject,
                default_building: defaultBuilding,
                garageDoorColor,
                manufacture_data: manufactureData,
                popular_colors: popularColors,
            };
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Error getting building data: ${error.message}`);
        }
    }

    /**
     * Aggregates details for a single building.
     */
    private buildBuildingAggregate(
        building: any,
        roofStyles: any[],
        trusses: any[],
        legHeights: any[],
        drawings: any[],
        gables: any[],
        sideDetails: any[],
        leanTo: any[],
        customSizes: any[]
    ): IBuildingDetail {
        const mapId: number = Number(building.map_id);
        const buildingId: number = Number(building.building_id);

        const roof_style = this.prepareRoofStyles(
            roofStyles.filter((r) => Number(r.building_id) === buildingId && Number(r.map_id) === mapId)
        );

        const truss_name = this.prepareTrusses(trusses.filter((t) => Number(t.map_id) === mapId));
        const fixed_new_leg_width = legHeights.filter((n) => Number(n.map_id) === mapId).map((n) => n.height_data);

        const drawingsForMap = drawings.find((d) => Number(d.map_id) === mapId)?.data ?? [];

        const gable_mapping = this.prepareGableMapping(
            gables.filter((g) => Number(g.map_id) === mapId),
            roof_style,
            buildingId
        );

        const { data: side_end_details, wainscot } = this.prepareSideEndDetails(
            sideDetails.find((s) => Number(s.map_id) === mapId)
        ) || { data: [], wainscot: [] };

        const lean_to_roof_pitch = leanTo.filter((l) => Number(l.map_id) === mapId);
        const custom_size_status = this.safeParse(customSizes.find((c) => Number(c.map_id) === mapId)?.row_data);

        return {
            building_type: building,
            roof_style,
            truss_name,
            garage_door: [],
            garage_door_v3: [],
            garage_door_frameout: [],
            walkin_door_frameout: [],
            walkin_door_frameout_v3: [],
            window_frameout: [],
            window_frameout_v3: [],
            fixed_new_leg_width,
            drawings: drawingsForMap,
            gable_mapping,
            side_end_details,
            wainscot_details: wainscot,
            lean_to_roof_pitch,
            custom_size_status,
        };
    }

    /**
     *
     * @param ids - The list of numeric IDs to be wrapped.
     * @returns A single string of quoted IDs formatted for SQL.
     */
    private wrapIdsForSql(ids: number[]): string
    {
        return `'${ids.join("','")}'`;
    }

    /**
     * @param roofStyles - The raw array of roof style objects to prepare.
     * @returns A new array of roof styles with normalized and enriched conditions.
     */

    private prepareRoofStyles(roofStyles: any[]): any[]
    {
        return roofStyles.map((roof) => {
            roof.conditions = this.safeParse(roof.conditions, {});

            if (Array.isArray(roof.conditions?.condition))
            {
                roof.conditions.condition = roof.conditions.condition.map((c) =>
                    c.name === "Reinforced Legs" ? { ...c, legs_type: "reinforced" } : c
                );
            }
            return roof;
        });
    }

    /**
     * @returns A new array of trusses with `price_of` normalized as an array.
     */

    private prepareTrusses(trusses: any[]): any[]
    {
        return trusses.map((t) => ({
            ...t,
            price_of: this.safeParse(t.price_of, []),
        }));
    }

    /**
     * @param gables - The list of gable mappings to normalize.
     * @param roofStyles - The available roof style definitions for comparison.
     * @param buildingId - The building identifier, used to apply special rules (e.g., default gable for ID `24`).
     * @throws {Error} if `buildDefaultGable` fails to construct a default gable.
     */

    private prepareGableMapping(gables: any[], roofStyles: any[], buildingId: number): any[]
    {
        const roofParam = roofStyles.find((r) => r.roof_id === 3);

        if (!roofParam)
        {
            return gables
        }

        if (gables.length === 0 && buildingId === 24)
        {
            return [this.buildDefaultGable(roofParam)];
        }

        if (gables[0])
        {
            const gm = gables[0];
            gm.max_width = Math.max(gm.max_width || 0, roofParam.max_width);
            gm.max_height = Math.max(gm.max_height || 0, roofParam.max_height);
            gm.max_length = Math.max(gm.max_length || 0, roofParam.end_length);
            gables[0] = gm;
        }

        return gables;
    }

    /**
     * @param roofParam - The roof style object to derive default gable properties from.
     * @returns A gable object with default dimensions and distance constraints.
     */

    private buildDefaultGable(roofParam: any)
    {
        return {
            map_id: roofParam.map_id,
            min_width: roofParam.min_width,
            max_width: roofParam.max_width,
            distance_on_width: roofParam.distance_on_width,
            min_height: roofParam.min_height,
            max_height: roofParam.max_height,
            distance_on_height: roofParam.distance_on_height,
            min_length: roofParam.start_length,
            max_length: roofParam.end_length,
            distance_on_length: roofParam.distance_on_length,
        };
    }

    /**
     * @param colors - The array of raw color objects to transform.
     * @returns A record mapping color IDs to their corresponding normalized objects.
     */

    private buildColorObject(colors: any[]): Record<number, any>
    {
        return Object.fromEntries(
            colors.map((c) => {
                c.color_add_ons = this.safeParse(c.color_add_ons, []);
                c.applied_on = this.safeParse(c.applied_on, ["roof", "trim", "wall"]);
                return [c.id, c];
            })
        );
    }

    /**
     * @typeParam T - The expected type of the parsed value.
     * @param value - The value to parse.
     * @param fallback - The default value to return if parsing fails or `value` is nullish.
     * @returns The parsed value if successful, otherwise the fallback.
     */

    private safeParse<T = any>(value: any, fallback: T = null as any): T
    {
        try
        {
            return typeof value === "string" ? JSON.parse(value) : (value ?? fallback);
        }
        catch
        {
            return fallback;
        }
    }

    /**
     * @param inputArray - The raw array of lean-to items to transform. Can be undefined.
     * @returns An object mapping each direction and gable direction to its prepared lean-to data.
     */

    private prepareLeanToDataFromArray(inputArray: any[] | undefined)
    {
        const outputArray: any = {
            front: [],
            back: [],
            right: [],
            left: [],
            gable_front: [],
            gable_back: [],
            gable_right: [],
            gable_left: [],
        };

        (inputArray || []).forEach(item => {
            const { type, wall, size, roof_pitch } = item;
            outputArray[type] = {
                size,
                roof_pitch,
                wall: this.prepareWallFromArray(wall, type),
            };
        })

        return outputArray;
    }

    /**
     * @param inputArray - An array of wall definitions in string format (`key1__key2`). Defaults to an empty array.
     * @param type - Optional type of wall mapping (`front`, `back`, `right`, `left`, or gable types) to determine the structure.
     * @returns An object mapping wall directions to their corresponding states.
     */

    private async prepareWallFromArray(inputArray: any[] = [], type: string | null = null)
    {
        let outputArray: any =
            {
                front: "Open",
                back: "Open",
                right: "Open",
                left: "Open",
            };

        if(type)
        {
            const check_leanto: boolean = ["front", "back", "right", "left"].includes(type);

            if(check_leanto)
            {
                outputArray = {
                    front_wall: 'Open',
                    back_wall: 'Open',
                    side_wall: 'Open'
                };
            }

            const check_leanto_gable: boolean = ['gable_front', 'gable_back', 'gable_right', 'gable_left'].includes(type);

            if(check_leanto_gable)
            {
                outputArray = {
                    front_wall: 'Open',
                    back_wall: 'Open',
                    left_side: 'Open',
                    right_side: 'Open'
                };
            }
        }

        (inputArray || []).forEach((item) =>
        {
            const [ key1, key2 ] = String(item).split("__");

            if(outputArray.hasOwnProperty(key1))
            {
                outputArray[key1] = key2;
            }
        })

        return outputArray;
    }

    /**
     * @param default_building - Array of raw building objects to normalize.
     * @param manufacturer_id - The manufacturer ID, used to apply specific building rules.
     * @param state_id - The state ID, used to apply specific building rules.
     * @returns An array of buildings with normalized and enriched default data.
     * @throws {Error} if JSON parsing of `wall` or `leanto_data` fails.
     */

    private prepareDefaultBuildingData(default_building: any[], manufacturer_id: string, state_id: string)
    {
        return (default_building || []).map(item =>
        {
            if (item.other_building_id && [ ManufacturerIds.M162, ManufacturerIds.M174 ].includes(manufacturer_id) && [...StateIds.OPEN_STATES, ...StateIds.SPECIAL_STATES].includes(state_id))
            {

                let idsToRemove: string[] = BuildingIdsToRemove.DEFAULT;

                if (manufacturer_id === ManufacturerIds.M174 && StateIds.OPEN_STATES.includes(state_id))
                {
                    idsToRemove = BuildingIdsToRemove.M174;
                }
                else if (manufacturer_id === ManufacturerIds.M162 && StateIds.SPECIAL_STATES.includes(state_id))
                {
                    idsToRemove = BuildingIdsToRemove.M162_SPECIAL;
                }

                const regex = new RegExp(idsToRemove.map(id => `\\b${id}\\b,?`).join('|'), 'g');
                item.other_building_id = item.other_building_id.replace(regex, '').replace(/,+$/, '');

                const otherIds = item.other_building_id.split(',').filter(Boolean);

                const selectedId = (BuildingIdSelection as any)[manufacturer_id]?.[state_id]?.find((id: string) => otherIds.includes(id));

                if (selectedId)
                {
                    item.building_id = selectedId
                }
            }

            if (item.default_doors?.[0] && !item.default_doors[0].size)
            {
                item.default_doors = [];
            }

            if (item.wall)
            {
                if (item.wall === 'open')
                {
                    item.wall = this.prepareWallFromArray(["front__Open", "back__Open", "right__Open", "left__Open"])
                }
                else if (item.wall === 'close')
                {
                    item.wall = this.prepareWallFromArray(["front__Close", "back__Close", "right__Close", "left__Close"])
                }
                else
                {
                    try
                    {
                        const wallArray = JSON.parse(item.wall);
                        item.wall = Array.isArray(wallArray) ? this.prepareWallFromArray(wallArray) : [];
                    }
                    catch
                    {
                        item.wall = [];
                    }
                }
            }
            else
            {
                item.wall = [];
            }

            const leanto_data = item.leanto_data ? (() => { try { return JSON.parse(item.leanto_data); } catch { return []; } })() : [];

            if (leanto_data.length > 0)
            {
                item.leanto_wall = null;
                item.leanto = null;
                item.leanto_size = null;
            }

            item.leanto_data = this.prepareLeanToDataFromArray(leanto_data);

            if (!item.leanto)
            {
                item.leanto_roof_pitch = null
            }

            return item;
        });
    }

    /**
     * @param data - An array of raw leg height objects to process.
     * @returns A normalized array of objects with `map_id` and nested `height_data`.
     */

    private prepareNewLegHeightMinMaxHeight(data: any[]): IOutputEntry[]
    {
        const map = new Map<string, IOutputEntry>();

        for (const { map_id, width, min_height, max_height, min_smaller_height, max_smaller_height } of (data || []))
        {
            const heightData: IHeightData = { min_height, max_height, min_smaller_height, max_smaller_height };

            if (!map.has(map_id))
            {
                map.set(map_id, { map_id, height_data: {} });
            }

            map.get(map_id)!.height_data[width] = heightData;
        }

        return Array.from(map.values());
    }

    /**
     * @param data - An array of raw drawing objects to process.
     * @returns A normalized array where each element contains a `map_id` and an array of associated drawing objects.
     */


    private prepareDrawingData(data: IDrawingItem[]): IDrawingGroup[]
    {
        const map = new Map<string | number, IDrawingGroup>();

        for (const item of data || []) {
            const { id, map_id, width, name, cost_type, cost, is_cost, is_default } = item;
            const drawingData: IDrawingItem = { id, map_id, width, name, cost_type, cost, is_cost, is_default };

            if (!map.has(map_id)) {
                map.set(map_id, { map_id, data: [] });
            }

            map.get(map_id)!.data.push(drawingData);
        }

        return Array.from(map.values());
    }

    /**
     * @param data - Raw input object containing a `settings` field with JSON panel configurations.
     * @returns An object containing:
     *   - `data`: Array of processed side/end/extra/gable panel objects.
     *   - `wainscot`: Array of normalized wainscot objects.
     */

    private prepareSideEndDetails(data: any)
    {
        const outputMap = new Map<string, any>();
        const wainscotMap = new Map<string, any>();

        const safeParse = (value: any, fallback: any = []) =>
        {
            try
            {
                return typeof value === "string" ? JSON.parse(value) : value ?? fallback;
            }
            catch
            {
                return fallback;
            }
        };

        const normalizePanelItem = (item: any, includeWainscot?: boolean) =>
        {
            const {
                name,
                label,
                price_type,
                percentage_amount,
                price_of,
                panel_price_from = null,
                panel_orientation = null,
                applicable_wainscot_horizontal = null,
                applicable_wainscot_vertical = null
            } = item;

            return {
                name,
                label,
                price_type,
                cost: percentage_amount,
                price_of: price_type === "%" ? safeParse(price_of) : [],
                panel_price_from: panel_price_from && price_type === "%" ? safeParse(panel_price_from) : [],
                panel_orientation: safeParse(panel_orientation),
                applicable_wainscot_horizontal: includeWainscot ? safeParse(applicable_wainscot_horizontal) : undefined,
                applicable_wainscot_vertical: includeWainscot ? safeParse(applicable_wainscot_vertical) : undefined,
            };
        };

        const normalizeWainscotItem = (item: any) =>
        {
            const {
                name,
                label,
                price_type,
                horizontal_cost = 0,
                vertical_cost = 0,
                price_of,
                panel_price_from = null,
                panel_orientation = null
            } = item;

            return {
                name,
                label,
                price_type,
                horizontal_cost,
                vertical_cost,
                price_of: price_type === "%" ? safeParse(price_of) : [],
                panel_price_from: panel_price_from && price_type === "%" ? safeParse(panel_price_from) : [],
                panel_orientation: safeParse(panel_orientation),
            };
        };

        let settingData: any = {};

        try
        {
            if (data?.settings)
            {
                settingData = JSON.parse(data.settings)
            }
        }
        catch
        {
            settingData = {};
        }

        const processGroup = (group: any[], includeWainscot = false) =>
        {
            (group || []).forEach((item) => {
                const normalized = normalizePanelItem(item, includeWainscot);

                if (!outputMap.has(normalized.name))
                {
                    outputMap.set(normalized.name, normalized);
                }
            });
        };

        processGroup(settingData.side_closed, true);
        processGroup(settingData.end_closed);
        processGroup(settingData.extra_panels);
        processGroup(settingData.gable_ends);

        (settingData.wainscot || []).forEach((item: any) =>
        {
            const normalized = normalizeWainscotItem(item);

            if (!wainscotMap.has(normalized.name))
            {
                wainscotMap.set(normalized.name, normalized);
            }
        });

        const validWainscotNames = new Set([...wainscotMap.keys()]);
        for (const entry of outputMap.values())
        {
            if (Array.isArray(entry.applicable_wainscot_horizontal))
            {
                entry.applicable_wainscot_horizontal = entry.applicable_wainscot_horizontal.filter((w: string) =>
                    validWainscotNames.has(w)
                );
            }

            if (Array.isArray(entry.applicable_wainscot_vertical))
            {
                entry.applicable_wainscot_vertical = entry.applicable_wainscot_vertical.filter((w: string) =>
                    validWainscotNames.has(w)
                );
            }
        }

        if (!outputMap.has("metal"))
        {
            outputMap.set("metal", {
                name: "metal",
                label: "Metal",
                price_type: "$",
                price_of: [],
                cost: 0,
                panel_price_from: [],
                panel_orientation: [],
                applicable_wainscot_horizontal: [],
                applicable_wainscot_vertical: []
            });
        }

        return {
            data: Array.from(outputMap.values()),
            wainscot: Array.from(wainscotMap.values())
        };
    }

    private isDrawingItemArray(data: unknown[]): data is IDrawingItem[]
    {
        return Array.isArray(data) && data.every(item =>
            item &&
            typeof item === "object" &&
            "id" in item &&
            "map_id" in item &&
            "width" in item &&
            "name" in item &&
            "cost_type" in item &&
            "cost" in item &&
            "is_cost" in item &&
            "is_default" in item
        );
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
