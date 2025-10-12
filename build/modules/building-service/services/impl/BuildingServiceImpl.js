"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingServiceImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ServerError_1 = require("../../../../errors/ServerError");
const ProcedureExecutor_1 = require("../../../../utils/procedure/ProcedureExecutor");
const IStateIds_1 = require("../../../building-service/services/io/IStateIds");
const IManufacturerIds_1 = require("../../../building-service/services/io/IManufacturerIds");
const BuildingIdsToRemove_1 = require("../../../building-service/services/io/BuildingIdsToRemove");
const BuildingIdSelection_1 = require("../../../building-service/services/io/BuildingIdSelection");
class BuildingServiceImpl {
    static instance;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use BuildingService.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!BuildingServiceImpl.instance) {
            BuildingServiceImpl.instance = new BuildingServiceImpl(Enforce);
        }
        return BuildingServiceImpl.instance;
    }
    async fetchBuildingData(params) {
        const { state_id, manufacturer_id } = params;
        let buildingMapping;
        try {
            buildingMapping = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([state_id, manufacturer_id], "getBuildingMappingData(?, ?)", "window_frameout");
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to fetch building mapping data: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (!Array.isArray(buildingMapping) || buildingMapping.length === 0) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.NOT_FOUND, "No building mapping found");
        }
        try {
            const mapIds = buildingMapping.map((d) => Number(d.map_id));
            const leanToIds = buildingMapping.filter((d) => d.type_of_building === 2).map((d) => Number(d.map_id));
            const mapIdsString = this.wrapIdsForSql(mapIds);
            const leanToIdsString = this.wrapIdsForSql(leanToIds);
            const [allRoofStyle, allTrussName, legHeightRaw, drawingRaw, gableMappingRaw, leanToRoofPitch, sideEndDetails, customSizeStatus,] = await Promise.all([
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString, manufacturer_id], "getAllRoofStyle(?, ?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString], "getTrussName(?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString], "getNewLegheightMinMax(?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString], "getDrawings(?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString], "getAllGableMapping(?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([leanToIdsString], "getAllLeanToRoofPitch(?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString], "getSideEndDetails(?)", ""),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapIdsString], "getCustomSizeStatus(?)", ""),
            ]);
            const legHeightPrepared = this.prepareNewLegHeightMinMaxHeight(legHeightRaw);
            if (!this.isDrawingItemArray(drawingRaw)) {
                throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, "Invalid drawing data from DB");
            }
            const drawingsPrepared = this.prepareDrawingData(drawingRaw);
            const buildings = buildingMapping.map((b) => this.buildBuildingAggregate(b, allRoofStyle, allTrussName, legHeightPrepared, drawingsPrepared, gableMappingRaw, sideEndDetails, leanToRoofPitch, customSizeStatus));
            const [defaultBuildingRaw, colors, garageDoorColor, manufactureData, popularColors,] = await Promise.all([
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([state_id, manufacturer_id], "getDefaultBuilding(?, ?)", "default_building"),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([manufacturer_id], "getColor(?)", "color"),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([manufacturer_id], "getGarageDoorColor(?)", "garageDoorColor"),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([manufacturer_id], "getManufactureData(?)", "manufacture_data"),
                ProcedureExecutor_1.ProcedureExecutor.getProcedureData([manufacturer_id], "getPopularColors(?)", "popular_colors"),
            ]);
            const defaultBuilding = this.prepareDefaultBuildingData(defaultBuildingRaw, manufacturer_id, state_id);
            const colorObject = this.buildColorObject(colors);
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
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Error getting building data: ${error.message}`);
        }
    }
    buildBuildingAggregate(building, roofStyles, trusses, legHeights, drawings, gables, sideDetails, leanTo, customSizes) {
        const mapId = Number(building.map_id);
        const buildingId = Number(building.building_id);
        const roof_style = this.prepareRoofStyles(roofStyles.filter((r) => Number(r.building_id) === buildingId && Number(r.map_id) === mapId));
        const truss_name = this.prepareTrusses(trusses.filter((t) => Number(t.map_id) === mapId));
        const fixed_new_leg_width = legHeights.filter((n) => Number(n.map_id) === mapId).map((n) => n.height_data);
        const drawingsForMap = drawings.find((d) => Number(d.map_id) === mapId)?.data ?? [];
        const gable_mapping = this.prepareGableMapping(gables.filter((g) => Number(g.map_id) === mapId), roof_style, buildingId);
        const { data: side_end_details, wainscot } = this.prepareSideEndDetails(sideDetails.find((s) => Number(s.map_id) === mapId)) || { data: [], wainscot: [] };
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
    wrapIdsForSql(ids) {
        return `'${ids.join("','")}'`;
    }
    prepareRoofStyles(roofStyles) {
        return roofStyles.map((roof) => {
            roof.conditions = this.safeParse(roof.conditions, {});
            if (Array.isArray(roof.conditions?.condition)) {
                roof.conditions.condition = roof.conditions.condition.map((c) => c.name === "Reinforced Legs" ? { ...c, legs_type: "reinforced" } : c);
            }
            return roof;
        });
    }
    prepareTrusses(trusses) {
        return trusses.map((t) => ({
            ...t,
            price_of: this.safeParse(t.price_of, []),
        }));
    }
    prepareGableMapping(gables, roofStyles, buildingId) {
        const roofParam = roofStyles.find((r) => r.roof_id === 3);
        if (!roofParam) {
            return gables;
        }
        if (gables.length === 0 && buildingId === 24) {
            return [this.buildDefaultGable(roofParam)];
        }
        if (gables[0]) {
            const gm = gables[0];
            gm.max_width = Math.max(gm.max_width || 0, roofParam.max_width);
            gm.max_height = Math.max(gm.max_height || 0, roofParam.max_height);
            gm.max_length = Math.max(gm.max_length || 0, roofParam.end_length);
            gables[0] = gm;
        }
        return gables;
    }
    buildDefaultGable(roofParam) {
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
    buildColorObject(colors) {
        return Object.fromEntries(colors.map((c) => {
            c.color_add_ons = this.safeParse(c.color_add_ons, []);
            c.applied_on = this.safeParse(c.applied_on, ["roof", "trim", "wall"]);
            return [c.id, c];
        }));
    }
    safeParse(value, fallback = null) {
        try {
            return typeof value === "string" ? JSON.parse(value) : (value ?? fallback);
        }
        catch {
            return fallback;
        }
    }
    prepareLeanToDataFromArray(inputArray) {
        const outputArray = {
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
        });
        return outputArray;
    }
    async prepareWallFromArray(inputArray = [], type = null) {
        let outputArray = {
            front: "Open",
            back: "Open",
            right: "Open",
            left: "Open",
        };
        if (type) {
            const check_leanto = ["front", "back", "right", "left"].includes(type);
            if (check_leanto) {
                outputArray = {
                    front_wall: 'Open',
                    back_wall: 'Open',
                    side_wall: 'Open'
                };
            }
            const check_leanto_gable = ['gable_front', 'gable_back', 'gable_right', 'gable_left'].includes(type);
            if (check_leanto_gable) {
                outputArray = {
                    front_wall: 'Open',
                    back_wall: 'Open',
                    left_side: 'Open',
                    right_side: 'Open'
                };
            }
        }
        (inputArray || []).forEach((item) => {
            const [key1, key2] = String(item).split("__");
            if (outputArray.hasOwnProperty(key1)) {
                outputArray[key1] = key2;
            }
        });
        return outputArray;
    }
    prepareDefaultBuildingData(default_building, manufacturer_id, state_id) {
        return (default_building || []).map(item => {
            if (item.other_building_id && [IManufacturerIds_1.ManufacturerIds.M162, IManufacturerIds_1.ManufacturerIds.M174].includes(manufacturer_id) && [...IStateIds_1.StateIds.OPEN_STATES, ...IStateIds_1.StateIds.SPECIAL_STATES].includes(state_id)) {
                let idsToRemove = BuildingIdsToRemove_1.BuildingIdsToRemove.DEFAULT;
                if (manufacturer_id === IManufacturerIds_1.ManufacturerIds.M174 && IStateIds_1.StateIds.OPEN_STATES.includes(state_id)) {
                    idsToRemove = BuildingIdsToRemove_1.BuildingIdsToRemove.M174;
                }
                else if (manufacturer_id === IManufacturerIds_1.ManufacturerIds.M162 && IStateIds_1.StateIds.SPECIAL_STATES.includes(state_id)) {
                    idsToRemove = BuildingIdsToRemove_1.BuildingIdsToRemove.M162_SPECIAL;
                }
                const regex = new RegExp(idsToRemove.map(id => `\\b${id}\\b,?`).join('|'), 'g');
                item.other_building_id = item.other_building_id.replace(regex, '').replace(/,+$/, '');
                const otherIds = item.other_building_id.split(',').filter(Boolean);
                const selectedId = BuildingIdSelection_1.BuildingIdSelection[manufacturer_id]?.[state_id]?.find((id) => otherIds.includes(id));
                if (selectedId) {
                    item.building_id = selectedId;
                }
            }
            if (item.default_doors?.[0] && !item.default_doors[0].size) {
                item.default_doors = [];
            }
            if (item.wall) {
                if (item.wall === 'open') {
                    item.wall = this.prepareWallFromArray(["front__Open", "back__Open", "right__Open", "left__Open"]);
                }
                else if (item.wall === 'close') {
                    item.wall = this.prepareWallFromArray(["front__Close", "back__Close", "right__Close", "left__Close"]);
                }
                else {
                    try {
                        const wallArray = JSON.parse(item.wall);
                        item.wall = Array.isArray(wallArray) ? this.prepareWallFromArray(wallArray) : [];
                    }
                    catch {
                        item.wall = [];
                    }
                }
            }
            else {
                item.wall = [];
            }
            const leanto_data = item.leanto_data ? (() => { try {
                return JSON.parse(item.leanto_data);
            }
            catch {
                return [];
            } })() : [];
            if (leanto_data.length > 0) {
                item.leanto_wall = null;
                item.leanto = null;
                item.leanto_size = null;
            }
            item.leanto_data = this.prepareLeanToDataFromArray(leanto_data);
            if (!item.leanto) {
                item.leanto_roof_pitch = null;
            }
            return item;
        });
    }
    prepareNewLegHeightMinMaxHeight(data) {
        const map = new Map();
        for (const { map_id, width, min_height, max_height, min_smaller_height, max_smaller_height } of (data || [])) {
            const heightData = { min_height, max_height, min_smaller_height, max_smaller_height };
            if (!map.has(map_id)) {
                map.set(map_id, { map_id, height_data: {} });
            }
            map.get(map_id).height_data[width] = heightData;
        }
        return Array.from(map.values());
    }
    prepareDrawingData(data) {
        const map = new Map();
        for (const item of data || []) {
            const { id, map_id, width, name, cost_type, cost, is_cost, is_default } = item;
            const drawingData = { id, map_id, width, name, cost_type, cost, is_cost, is_default };
            if (!map.has(map_id)) {
                map.set(map_id, { map_id, data: [] });
            }
            map.get(map_id).data.push(drawingData);
        }
        return Array.from(map.values());
    }
    prepareSideEndDetails(data) {
        const outputMap = new Map();
        const wainscotMap = new Map();
        const safeParse = (value, fallback = []) => {
            try {
                return typeof value === "string" ? JSON.parse(value) : value ?? fallback;
            }
            catch {
                return fallback;
            }
        };
        const normalizePanelItem = (item, includeWainscot) => {
            const { name, label, price_type, percentage_amount, price_of, panel_price_from = null, panel_orientation = null, applicable_wainscot_horizontal = null, applicable_wainscot_vertical = null } = item;
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
        const normalizeWainscotItem = (item) => {
            const { name, label, price_type, horizontal_cost = 0, vertical_cost = 0, price_of, panel_price_from = null, panel_orientation = null } = item;
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
        let settingData = {};
        try {
            if (data?.settings) {
                settingData = JSON.parse(data.settings);
            }
        }
        catch {
            settingData = {};
        }
        const processGroup = (group, includeWainscot = false) => {
            (group || []).forEach((item) => {
                const normalized = normalizePanelItem(item, includeWainscot);
                if (!outputMap.has(normalized.name)) {
                    outputMap.set(normalized.name, normalized);
                }
            });
        };
        processGroup(settingData.side_closed, true);
        processGroup(settingData.end_closed);
        processGroup(settingData.extra_panels);
        processGroup(settingData.gable_ends);
        (settingData.wainscot || []).forEach((item) => {
            const normalized = normalizeWainscotItem(item);
            if (!wainscotMap.has(normalized.name)) {
                wainscotMap.set(normalized.name, normalized);
            }
        });
        const validWainscotNames = new Set([...wainscotMap.keys()]);
        for (const entry of outputMap.values()) {
            if (Array.isArray(entry.applicable_wainscot_horizontal)) {
                entry.applicable_wainscot_horizontal = entry.applicable_wainscot_horizontal.filter((w) => validWainscotNames.has(w));
            }
            if (Array.isArray(entry.applicable_wainscot_vertical)) {
                entry.applicable_wainscot_vertical = entry.applicable_wainscot_vertical.filter((w) => validWainscotNames.has(w));
            }
        }
        if (!outputMap.has("metal")) {
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
    isDrawingItemArray(data) {
        return Array.isArray(data) && data.every(item => item &&
            typeof item === "object" &&
            "id" in item &&
            "map_id" in item &&
            "width" in item &&
            "name" in item &&
            "cost_type" in item &&
            "cost" in item &&
            "is_cost" in item &&
            "is_default" in item);
    }
}
exports.BuildingServiceImpl = BuildingServiceImpl;
function Enforce() {
}
//# sourceMappingURL=BuildingServiceImpl.js.map