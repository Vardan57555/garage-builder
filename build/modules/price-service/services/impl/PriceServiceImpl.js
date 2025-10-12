"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceServiceImpl = void 0;
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const ResponseTypes_1 = require("../../../../common/io/enum/ResponseTypes");
const ValidationError_1 = require("../../../../errors/ValidationError");
const ProcedureExecutor_1 = require("../../../../utils/procedure/ProcedureExecutor");
const PriceDataValidator_1 = require("../../../price-service/services/validator/PriceDataValidator");
const ServerError_1 = require("../../../../errors/ServerError");
const Constants_1 = require("../../../../common/io/Constants");
const MySqlManager_1 = require("../../../../config/db/MySqlManager");
const PredictionManager_1 = require("../../../../config/AiModel/PredictionManager");
const Log_1 = require("../../../../utils/logger/Log");
const LeadAgent_1 = require("../../../../agents/LeadAgent");
const logger = (0, Log_1.createLogger)(module);
class PriceServiceImpl {
    static instance;
    session = null;
    static BASE_KEYS = [
        'truss_name',
    ];
    static PROCEDURE_MAP = {
        end: ({ map_id, width, height }) => [
            [map_id, width, height],
            'getEachEndClose(?, ?, ?)'
        ],
        gable_end: ({ map_id, width }) => [
            [map_id, width],
            'getGableEnd(?, ?)'
        ],
        truss_name: ({ map_id }) => [
            [map_id],
            'getTrussName(?)'
        ],
        getWindow: ({ map_id }) => [
            [map_id],
            'getWindow(?)'
        ],
        walkin_door_frameout: ({ map_id }) => [
            [map_id],
            'getWalkinDoor(?)'
        ],
        getAnchor: ({ map_id }) => [
            [map_id],
            'getAnchor(?)'
        ],
        garage_door: ({ map_id }) => [
            [map_id],
            'getGarageDoor(?)'
        ],
        garage_door_frameout: ({ map_id }) => [
            [map_id],
            'getGarageDoorFrameout(?)'
        ],
        end_cross_bracing: ({ map_id, width, height }) => [
            [map_id, width, height],
            'getEndCrossBracing(?, ?, ?)'
        ],
        insulation: ({ map_id, width, length, height, roof_id, manufacturer }) => [
            [map_id, width, length, height, roof_id, manufacturer[0]?.manufacturer_id],
            'getInsulation(?, ?, ?, ?, ?, ?)'
        ],
        certificate: ({ map_id, width, height, length, structureString }) => [
            [map_id, width, height, length, structureString],
            'getCertificate(?, ?, ?, ?, ?)'
        ],
        full_length_panel: ({ map_id, length, structureString }) => [
            [map_id, length, structureString],
            'getExtraPanel(?, ?, ?)'
        ],
        side_cross_bracing: ({ map_id, height, length, structureString }) => [
            [map_id, height, length, structureString],
            'getCrossBracing(?, ?, ?, ?)'
        ],
        delux_two_tone: ({ map_id, width, length, structureString }) => [
            [map_id, width, length, structureString],
            'getDeluxTwoTone(?, ?, ?, ?)'
        ],
        braces: ({ map_id, length, structureString }) => [
            [map_id, length, structureString],
            'getbraces(?, ?, ?)'
        ],
        bows: ({ map_id, width, height }) => [
            [map_id, width, height],
            'getBow(?, ?, ?)'
        ],
        addons: ({ map_id, length, structureString }) => [
            [map_id, length, structureString],
            'getAddon(?, ?, ?)'
        ],
        addons_width: ({ map_id, width }) => [
            [map_id, width],
            'getAddonWidth(?, ?)'
        ],
        roof_pitch: ({ map_id, length, structureString }) => [
            [map_id, length, structureString],
            'getRoofPitch(?, ?, ?)'
        ],
        connection_fees: ({ map_id, width, length, structureString }) => [
            [map_id, width, length, structureString],
            'getConnectionFees(?, ?, ?, ?)'
        ],
        trusses: ({ map_id, width, height, length, structureString }) => [
            [map_id, width, height, length, structureString],
            'getTrussUpgrade(?, ?, ?, ?, ?)'
        ],
        full_length_side: ({ map_id, height, length, structureString }) => [
            [map_id, height, length, structureString],
            'getSidePrice(?, ?, ?, ?)'
        ],
        trusses_slope: ({ map_id, width, single_slope_height, structureString }) => [
            [map_id, width, single_slope_height, structureString],
            'getTrussUpgrade(?, ?, ?, ?)'
        ]
    };
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceService.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!PriceServiceImpl.instance) {
            PriceServiceImpl.instance = new PriceServiceImpl(Enforce);
        }
        return PriceServiceImpl.instance;
    }
    async fetchBuildingPricingWithUtility(params) {
        try {
            const { finalWidth, finalLength, finalHeight } = await this.calculateFinalDimensions(params);
            const { manufacturer, buildingStructureFull } = await this.fetchBaseData(params.map_id, params.roof_id, finalWidth, finalHeight, finalLength);
            if (!buildingStructureFull.length) {
                return { status: false, message: 'The given dimension is not available for the building' };
            }
            let pricing = {
                building_to_maxlength: finalLength,
                manufacturer,
                building_structure: buildingStructureFull
            };
            const componentKeys = this.getComponentKeys(params.single_slope_height);
            const components = await this.fetchComponentsPricing({
                map_id: params.map_id,
                roof_id: params.roof_id,
                width: finalWidth,
                height: finalHeight,
                length: finalLength,
                buildingStructureFull,
                manufacturer,
                single_slope_height: params.single_slope_height,
                componentKeys
            });
            Object.assign(pricing, components);
            if (params.utility_length > 0) {
                Object.assign(pricing, await this.fetchUtilityPricing(params, finalHeight, finalLength, buildingStructureFull));
            }
            if (params.central_map_id) {
                Object.assign(pricing, await this.fetchCentralPricing(params));
            }
            this.applyAddons(pricing);
            this.adjustConnectionFees(pricing, params.is_barn);
            return pricing;
        }
        catch (error) {
            logger.error("[Pricing] Error calculating pricing:", error);
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to calculate pricing: ${error.message}`);
        }
    }
    async predict(body) {
        if (!this.session) {
            throw new Error("Model not loaded yet");
        }
        try {
            const { width, length, height, single_slope_height = 0, map_id = 0, roof_id = 0, utility_length = 0, central_length = 0, central_width = 0, central_height = 0, central_utility_length = 0, is_barn = false } = body;
            const features = [
                width,
                length,
                height,
                single_slope_height,
                Number(map_id),
                Number(roof_id),
                utility_length,
                central_length,
                central_width,
                central_height,
                central_utility_length,
                is_barn ? 1 : 0
            ];
            return await PredictionManager_1.PredictionManager.getInstance().predict(features);
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to predict price: ${error.message}`);
        }
    }
    async generateAssistantResponse(body) {
        const { question } = body;
        let pricingData;
        try {
            const agent = await LeadAgent_1.LeadAgent.getInstance();
            pricingData = await agent.run(question);
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to generate explanation for question: "${question}". Reason: ${error.message || error}`);
        }
        return pricingData;
    }
    async fetchAllPrices({ map_id, height, building_type, gauge }) {
        try {
            const widthArray = [];
            const lengthArray = [];
            const basePrices = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([map_id, gauge], 'getBasePrices(?, ?)', 'base_prices');
            basePrices.forEach((record) => {
                if (record.structure) {
                    const [w, l] = record.structure.split('x').map(Number);
                    widthArray.push(w);
                    lengthArray.push(l);
                }
            });
            if ((building_type === 'garage' || building_type === 'commercial') && height > 0) {
                const sideCosts = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([map_id, lengthArray, height], 'getSideHeights(?, ?, ?)', 'side_heights');
                basePrices.forEach((record) => {
                    if (record.structure) {
                        const length = Number(record.structure.split('x')[1]);
                        sideCosts.forEach((side) => {
                            if (Number(side.length) === length) {
                                let sideCloseCost = (side.side_close_cost > 0 ? side.side_close_cost : side.vertical_side_cost) * 2 + side.leg_height_cost;
                                ['regular_cost', 'box_style_cost', 'vertical_roof_cost'].forEach(key => {
                                    record[key] = record[key] > 0 ? record[key] + sideCloseCost : 0;
                                });
                            }
                        });
                    }
                });
            }
            if ((building_type === 'garage' || building_type === 'commercial') && height > 0) {
                const endCosts = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([map_id, widthArray, height], 'getEachEndClose(?, ?, ?)', 'end_close');
                basePrices.forEach((record) => {
                    if (record.structure) {
                        const width = Number(record.structure.split('x')[0]);
                        endCosts.forEach(end => {
                            if (Number(end.width) === width) {
                                const endCloseCost = end.end_close_cost > 0 ? end.end_close_cost : end.vertical_ends_cost;
                                ['regular_cost', 'box_style_cost', 'vertical_roof_cost'].forEach(key => {
                                    record[key] = record[key] > 0 ? record[key] + endCloseCost * 2 : 0;
                                });
                            }
                        });
                    }
                });
            }
            return this.validateOutput(basePrices, ResponseTypes_1.ValidationTypes.SINGLE);
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `failed to get all prices ${error.message}`);
        }
    }
    async getSideHeightCostsLength(length, maxLength, distanceOnCenter, mapId) {
        if (length <= maxLength) {
            return [length];
        }
        const sql = 'CALL getSideHeightCostsLenght_(?, ?, ?)';
        try {
            const [result] = await MySqlManager_1.MySQLManager.getInstance().sequelize.query(sql, {
                replacements: [distanceOnCenter, length, mapId],
                type: 'SELECT'
            });
            const combs = result?.[0];
            if (combs?.combinations) {
                return combs.combinations.split(',').map((l) => Number(l));
            }
            return [length];
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `failed to get side height costs length ${error.message}`);
        }
    }
    async getBaseStructure({ map_id, roof_id }) {
        const safeMapId = map_id ?? 0;
        const safeRoofId = roof_id ?? 0;
        const structures = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([safeMapId, safeRoofId, null, null, null], 'getBuildingStructure', 'building_structure');
        return structures[0] || { min_width: 12, start_length: 12, min_height: 8 };
    }
    async getManufacturer(map_id) {
        return await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([map_id], 'getManufacture(?)', 'manufacturer');
    }
    async getFullStructure({ map_id, roof_id, width, height, length }) {
        const safeMapId = map_id ?? 0;
        const safeRoofId = roof_id ?? 0;
        const safeWidth = width ?? 0;
        const safeHeight = height ?? 0;
        const safeLength = length ?? 0;
        return await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([safeMapId, safeRoofId, safeWidth, safeHeight, safeLength], 'getBuildingStructure', 'building_structure');
    }
    getComponentKeys(single_slope_height) {
        return [
            ...PriceServiceImpl.BASE_KEYS,
            ...(single_slope_height ? ['trusses_slope'] : [])
        ];
    }
    async buildLengthString(length, end_length, distance_on_center, map_id) {
        const lengths = await this.getSideHeightCostsLength(length, end_length, distance_on_center, map_id);
        return `'${lengths.join("','")}'`;
    }
    async getUtilityPricing(params) {
        const { map_id, height, length, utility_length, buildingStructureFull, single_slope_height } = params;
        const { end_length, distance_on_center, side_end_name } = buildingStructureFull[0];
        const buildLengthData = async (len) => this.buildLengthString(len, end_length, distance_on_center, map_id);
        const newLength = length - utility_length;
        const sideLengthString = await buildLengthData(newLength);
        const utilityLengthString = await buildLengthData(utility_length);
        const [side, panel, utility_side] = await Promise.all([
            this.getProcedure([map_id, height, newLength, sideLengthString], 'getSidePrice(?, ?, ?, ?)', 'side'),
            this.getProcedure([map_id, newLength, sideLengthString, side_end_name], 'getExtraPanel(?, ?, ?, ?)', 'panel'),
            this.getProcedure([map_id, height, utility_length, utilityLengthString], 'getSidePrice(?, ?, ?, ?)', 'utility_side')
        ]);
        const utility_slope_height = single_slope_height
            ? this.transformUtilitySlopeHeight(await this.getProcedure([map_id, single_slope_height, utility_length, utilityLengthString], 'getSidePrice(?, ?, ?, ?)', 'utility_slope_height'), utility_length)
            : [];
        return { side, panel, utility_side, utility_slope_height };
    }
    async calculateFinalDimensions(params) {
        const baseStructure = await this.getBaseStructure({ map_id: params.map_id, roof_id: params.roof_id });
        return {
            finalWidth: Math.max(params.width || 0, baseStructure.min_width),
            finalLength: Math.max(params.length || 0, baseStructure.start_length),
            finalHeight: Math.max(params.height || 0, baseStructure.min_height)
        };
    }
    async fetchBaseData(map_id, roof_id, width, height, length) {
        const [manufacturer, buildingStructureFull] = await Promise.all([
            this.getManufacturer(map_id),
            this.getFullStructure({ map_id, roof_id, width, height, length })
        ]);
        return { manufacturer, buildingStructureFull };
    }
    async fetchComponentsPricing(params) {
        const components = await Promise.all(params.componentKeys.map(async (key) => {
            const procedureFn = PriceServiceImpl.PROCEDURE_MAP[key];
            if (!procedureFn) {
                throw new Error(`Unknown component key: ${key}`);
            }
            const [args, query] = procedureFn({
                ...params,
                structureString: `'${params.buildingStructureFull.map(s => `${params.width}x${s.end_length}`).join("','")}'`
            });
            const data = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData(args, query, key);
            return [key, data];
        }));
        return Object.fromEntries(components);
    }
    async fetchUtilityPricing(params, height, length, buildingStructureFull) {
        return this.getUtilityPricing({
            map_id: params.map_id,
            height,
            length,
            utility_length: params.utility_length,
            buildingStructureFull,
            single_slope_height: params.single_slope_height
        });
    }
    async fetchCentralPricing(params) {
        return this.getCentralStructurePricing({
            central_map_id: params.central_map_id,
            roof_id: params.roof_id,
            central_height: params.central_height,
            central_length: params.central_length,
            central_width: params.central_width,
            central_utility_length: params.central_utility_length,
            map_id: params.map_id
        });
    }
    applyAddons(pricing) {
        const { checkbox, checkboxQuantity, checkboxQuantityDropdown } = this.processAddons(pricing);
        pricing.checkbox = checkbox;
        pricing.checkbox_quantity = checkboxQuantity;
        pricing.checkbox_quantity_dropdown = checkboxQuantityDropdown;
    }
    adjustConnectionFees(pricing, is_barn) {
        if (is_barn !== 'yes') {
            pricing.connection_fees?.forEach(fee => fee.cost = 0);
        }
    }
    async getCentralStructurePricing({ central_map_id, roof_id, central_height, central_length, central_width, central_utility_length, map_id }) {
        const pricing = {};
        try {
            const centralStructure = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id ?? 0, roof_id ?? 0, null, null, null], 'getBuildingStructure(?, ?, ?, ?, ?)', 'building_structure');
            if (!centralStructure?.length) {
                return pricing;
            }
            const { end_length, distance_on_center } = centralStructure[0];
            if (central_height) {
                const centralLengthArrayFull = await this.getSideHeightCostsLength(central_length, end_length, distance_on_center, map_id);
                const centralNewLength = central_utility_length ? central_length - central_utility_length : central_length;
                const centralLengthArray = await this.getSideHeightCostsLength(centralNewLength, end_length, distance_on_center, map_id);
                const [centralSideFull, centralSide, centralTrusses, centralEnd] = await Promise.all([
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, central_length, centralLengthArrayFull], 'getSidePrice(?, ?, ?, ?)', 'central_side_full_length'),
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, centralNewLength, centralLengthArray], 'getSidePrice(?, ?, ?, ?)', 'central_side'),
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_width, central_height, central_length, centralLengthArrayFull], 'getTrussUpgrade(?, ?, ?, ?, ?)', 'central_trusses'),
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, central_width], 'getEachEndClose(?, ?, ?)', 'central_end')
                ]);
                Object.assign(pricing, {
                    central_side_full_length: centralSideFull,
                    central_side: centralSide,
                    central_trusses: centralTrusses,
                    central_end: centralEnd
                });
            }
            if (central_utility_length) {
                const centralUtilityArray = await this.getSideHeightCostsLength(central_utility_length, end_length, distance_on_center, map_id);
                const centralUtilitySide = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, central_utility_length, centralUtilityArray], 'getSidePrice(?, ?, ?, ?)', 'central_utility_side');
                centralUtilitySide.forEach((side) => {
                    side['utility_length'] = central_utility_length;
                });
                pricing['central_utility_side'] = centralUtilitySide;
            }
            return pricing;
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to get central structure pricing: ${error.message}`);
        }
    }
    processAddons(pricing) {
        const processAddons = (addons = [], type) => {
            const checkbox = addons.flatMap((addon) => Object.keys(addon)
                .filter((key) => !Constants_1.Constants.ESCAPE_KEYS.includes(key))
                .map((key) => ({
                name: key,
                label: Constants_1.Constants.LABEL_NAMES[key] || key,
                cost: addon[key]
            })));
            addons.forEach((addon) => {
                if (addon.jtrim && addon.jtrim > 0) {
                    pricing.jtrim = pricing.jtrim || [];
                    pricing.jtrim.push({
                        id: addon.id,
                        cost: addon.jtrim,
                        [type]: type === "side" ? addon.length : addon.width,
                        type
                    });
                }
            });
            return checkbox;
        };
        const checkbox = [
            ...processAddons(pricing.addons, "side"),
            ...processAddons(pricing.addons_width, "end")
        ];
        const checkboxQuantity = [];
        const checkboxQuantityDropdown = [];
        if (pricing.bows?.length) {
            checkboxQuantity.push({
                name: "bows",
                label: "Extra Bows",
                cost: pricing.bows[0].cost
            });
        }
        pricing.anchors_cost?.forEach((anchor) => checkboxQuantity.push({
            name: anchor.anchor_id,
            label: anchor.name,
            is_concrete: anchor.is_concrete,
            cost: anchor.cost
        }));
        const processOptions = (items = [], key) => {
            const options = items.filter((item) => item[key] > 0);
            if (options.length) {
                checkboxQuantityDropdown.push({
                    name: key,
                    label: `Extra ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                    options
                });
            }
            else {
                items.forEach((item) => checkboxQuantity.push({
                    name: key,
                    label: `Extra ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                    cost: item.cost
                }));
            }
        };
        processOptions(pricing.braces, "bracing_feet");
        processOptions(pricing.trusses, "truss");
        return { checkbox, checkboxQuantity, checkboxQuantityDropdown };
    }
    async getProcedure(params, procedureName, key) {
        return ProcedureExecutor_1.ProcedureExecutor.getProcedureData(params, procedureName, key);
    }
    transformUtilitySlopeHeight(data, utility_length) {
        return data.map(item => ({
            ...item,
            utility_length
        }));
    }
    validateOutput(price, type = ResponseTypes_1.ValidationTypes.SINGLE) {
        const validationMethods = {
            [ResponseTypes_1.ValidationTypes.SINGLE]: PriceDataValidator_1.PriceDataValidator.outputValidate,
            [ResponseTypes_1.ValidationTypes.ALL]: PriceDataValidator_1.PriceDataValidator.outputArrayValidate
        };
        const outputValidation = validationMethods[type](price);
        if (outputValidation.error) {
            throw new ValidationError_1.ValidationError(ValidationError_1.ValidationError.OUTPUT, outputValidation.error.message);
        }
        return outputValidation.value;
    }
}
exports.PriceServiceImpl = PriceServiceImpl;
function Enforce() {
}
//# sourceMappingURL=PriceServiceImpl.js.map