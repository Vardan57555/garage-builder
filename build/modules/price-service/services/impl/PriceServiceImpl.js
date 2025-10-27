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
const Log_1 = require("../../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class PriceServiceImpl {
    static instance;
    static BASE_KEYS = [
        'anchors_cost', 'truss_name', 'garage_door', 'garage_door_frameout', 'walkin_door_frameout',
        'window_frameout', 'end', 'end_cross_bracing', 'insulation', 'certificate',
        'full_length_panel', 'side_cross_bracing', 'braces', 'bows', 'addons',
        'addons_width', 'roof_pitch', 'additional_features', 'connection_fees', 'trusses', 'full_length_side'
    ];
    static PROCEDURE_MAP = {
        end: ({ map_id, width, height }) => [
            [map_id, height, width],
            'getEachEndClose(?, ?, ?)'
        ],
        gable_end: ({ map_id, width, side_end_name }) => {
            const safeSideEndName = this.safeStringParam(side_end_name);
            return [
                [map_id, width, safeSideEndName],
                'getGableEnd(?, ?, ?)'
            ];
        },
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
        anchors_cost: ({ map_id }) => [
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
        insulation: ({ map_id, width, height, length, manufacturer }) => [
            [map_id, width, height, length, manufacturer[0]?.manufacturer_id ?? 0],
            'getInsulation(?, ?, ?, ?, ?)'
        ],
        certificate: ({ map_id, width, height, length, structureString }) => [
            [map_id, width, height, length, structureString],
            'getCertificate(?, ?, ?, ?, ?)'
        ],
        full_length_panel: ({ map_id, length, structureString, side_end_name }) => [
            [map_id, length, structureString, this.safeStringParam(side_end_name)],
            'getExtraPanel(?, ?, ?, ?)'
        ],
        side_cross_bracing: ({ map_id, height, length, structureString }) => [
            [map_id, height, length, structureString],
            'getCrossBracing(?, ?, ?, ?)'
        ],
        delux_two_tone: ({ map_id, width, length, structureString, side_end_name }) => {
            const safeSideEndName = this.safeStringParam(side_end_name);
            const safeStructureString = this.safeStringParam(structureString);
            return [
                [map_id, width, length, safeStructureString, safeSideEndName],
                'getDeluxTwoTone(?, ?, ?, ?, ?)'
            ];
        },
        braces: ({ map_id, length, structureString }) => [
            [map_id, length, structureString],
            'getbraces(?, ?, ?)'
        ],
        additional_features: ({ map_id }) => [
            [map_id],
            'getAdditionalFeatures(?)'
        ],
        bows: ({ map_id }) => [
            [map_id],
            'getBowMapId(?)'
        ],
        addons: ({ map_id, length, structureString }) => [
            [map_id, length, structureString],
            'getAddon(?, ?, ?)'
        ],
        addons_width: ({ map_id, width }) => [
            [map_id, width],
            'getAddonWidth(?, ?)'
        ],
        roof_pitch: ({ map_id, width, length, structureString }) => [
            [map_id, width, length, structureString],
            'getRoofPitch(?, ?, ?, ?)'
        ],
        connection_fees: ({ map_id, width, height, length, structureString }) => [
            [map_id, width, height, length, structureString],
            'getConnectionFees(?, ?, ?, ?, ?)'
        ],
        trusses: ({ map_id, width, height, length, structureString }) => [
            [map_id, width, height, length, structureString],
            'getTrussUpgrade(?, ?, ?, ?, ?)'
        ],
        full_length_side: ({ map_id, height, length, structureString }) => [
            [map_id, height, length, structureString],
            'getSidePrice(?, ?, ?, ?)'
        ],
        trusses_slope: ({ map_id, width, single_slope_height, length, structureString }) => [
            [map_id, width, single_slope_height, length, structureString],
            'getTrussUpgrade(?, ?, ?, ?, ?)'
        ],
        getMapIdByStateName: (({ state_name }) => [
            [state_name],
            'getMapIdByStateName(?)'
        ]),
        window_frameout: ({ map_id }) => [
            [map_id],
            'getWindow(?)'
        ],
    };
    ARRAY_FIELDS = new Set([
        'addons',
        'addons_width',
        'anchors_cost',
        'bows',
        'braces',
        'trusses',
        'end',
        'garage_door_frameout',
        'walkin_door_frameout',
        'window_frameout'
    ]);
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
            const [{ finalWidth, finalLength, finalHeight }, { manufacturer, buildingStructureFull }] = await Promise.all([
                this.calculateFinalDimensions(params),
                this.fetchBaseData(params.map_id, params.roof_id, params.width, params.height, params.length)
            ]);
            if (!buildingStructureFull.length) {
                return {
                    status: false,
                    message: 'The given dimension is not available for the building'
                };
            }
            const structureString = `'${finalWidth}x${finalLength}'`;
            logger.info("[fetchBuildingPricingWithUtility] ====== PRICING DATA DEBUG ======");
            const basePrices = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([params.map_id, structureString, 'No'], 'getBasicPrice(?, ?, ?)', 'base_prices');
            if (!basePrices || basePrices.length === 0) {
                logger.warn(`[fetchBuildingPricingWithUtility] No pricing found for structure ${structureString}`);
                return {
                    status: false,
                    message: `No pricing available for dimensions ${finalWidth}x${finalLength}ft`
                };
            }
            const matchingPrice = basePrices[0];
            const pricing = {
                building_to_maxlength: finalLength,
                manufacturer,
                building_structure: buildingStructureFull,
                base_price_regular: matchingPrice.regular_cost ?? 0,
                base_price_box: matchingPrice.box_style_cost ?? 0,
                base_price_vertical: matchingPrice.vertical_roof_cost ?? 0,
                gauge: matchingPrice.gauge ?? (params.gauge ?? 14)
            };
            this.applyPricingMultipliers(pricing, params);
            const componentKeys = this.getComponentKeys(params.single_slope_height);
            const [components, utilityPricing, centralPricing] = await Promise.all([
                this.fetchComponentsPricing({
                    map_id: params.map_id,
                    roof_id: params.roof_id,
                    width: finalWidth,
                    height: finalHeight,
                    length: finalLength,
                    buildingStructureFull,
                    manufacturer,
                    single_slope_height: params.single_slope_height,
                    componentKeys
                }),
                params.utility_length && params.utility_length > 0
                    ? this.getUtilityPricing({ ...params, height: finalHeight, utility_length: params.utility_length, length: finalLength, buildingStructureFull })
                    : Promise.resolve(null),
                params.central_map_id
                    ? this.getCentralStructurePricing(params)
                    : Promise.resolve(null)
            ]);
            this.mergeComponents(pricing, components);
            if (utilityPricing)
                Object.assign(pricing, utilityPricing);
            if (centralPricing)
                Object.assign(pricing, centralPricing);
            this.applyAddons(pricing);
            this.adjustConnectionFees(pricing, params.is_barn);
            return pricing;
        }
        catch (error) {
            logger.error(`[Pricing] Error calculating pricing`, error);
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to calculate pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async fetchAllPrices({ map_id, height, building_type, gauge }) {
        try {
            const widthArray = [];
            const lengthArray = [];
            const basePrices = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([map_id, gauge], 'getBasicPrice(?, ?)', 'base_prices');
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
                const endCosts = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([map_id, height, widthArray], 'getEachEndClose(?, ?, ?)', 'end_close');
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
        const structures = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([safeMapId, safeRoofId, null, null, null], 'getBuildingStructure(?, ?, ?, ?, ?)', 'building_structure');
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
        return await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([safeMapId, safeRoofId, safeWidth, safeHeight, safeLength], 'getBuildingStructure(?, ?, ?, ?, ?)', 'building_structure');
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
        const { map_id, roof_id, width, height, length, buildingStructureFull, manufacturer, single_slope_height, componentKeys } = params;
        const { end_length, distance_on_center, side_end_name } = buildingStructureFull[0];
        const lengthArray = await this.getSideHeightCostsLength(length, end_length, distance_on_center, map_id);
        const structureString = `'${lengthArray.map(l => `${width}x${l}`).join("','")}'`;
        logger.info("[fetchComponentsPricing] Generated structure string:", structureString);
        logger.info("[fetchComponentsPricing] Length array:", lengthArray);
        const components = await Promise.all(componentKeys.map(async (key) => {
            const procedureFn = PriceServiceImpl.PROCEDURE_MAP[key];
            if (!procedureFn) {
                logger.warn(`[fetchComponentsPricing] Unknown component key: ${key}`);
                return [key, []];
            }
            try {
                const [args, query] = procedureFn({
                    map_id,
                    roof_id,
                    width,
                    height,
                    length,
                    manufacturer,
                    structureString,
                    lengthArray,
                    single_slope_height,
                    side_end_name: side_end_name || null,
                    buildingStructureFull: [],
                    componentKeys: []
                });
                logger.info(`[fetchComponentsPricing] Fetching ${key}`);
                logger.info(`[fetchComponentsPricing] Query: ${query}`);
                logger.info(`[fetchComponentsPricing] Args:`, args);
                const data = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData(args, query, key);
                logger.info(`[fetchComponentsPricing] Component ${key} returned ${Array.isArray(data) ? data.length : 'non-array'} items`);
                return [key, data];
            }
            catch (error) {
                logger.error(`[fetchComponentsPricing] Error fetching ${key}:`, error);
                return [key, []];
            }
        }));
        return Object.fromEntries(components);
    }
    applyAddons(pricing) {
        logger.info("[applyAddons] ====== BEFORE ADDON PROCESSING ======");
        logger.info("[applyAddons] Current pricing keys:", Object.keys(pricing));
        logger.info("[applyAddons] Current bows:", pricing.bows);
        logger.info("[applyAddons] Current addons:", pricing.addons);
        logger.info("[applyAddons] ====== END BEFORE ======");
        const { checkbox, checkboxQuantity, checkboxQuantityDropdown } = this.processAddons(pricing);
        pricing.checkbox = checkbox;
        pricing.checkbox_quantity = checkboxQuantity;
        pricing.checkbox_quantity_dropdown = checkboxQuantityDropdown;
        logger.info("[applyAddons] ====== AFTER ADDON PROCESSING ======");
        logger.info("[applyAddons] Current bows after:", pricing.bows);
        logger.info("[applyAddons] Current addons after:", pricing.addons);
        logger.info("[applyAddons] ====== END AFTER ======");
    }
    adjustConnectionFees(pricing, is_barn) {
        if (!is_barn) {
            pricing.connection_fees?.forEach(fee => fee.cost = 0);
        }
    }
    async getCentralStructurePricing(params) {
        const pricing = {};
        const { central_map_id, roof_id, central_height, central_length, central_width, central_utility_length, map_id } = params;
        try {
            const centralStructure = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id ?? 0, roof_id ?? 0, central_width, central_height, central_length], 'getBuildingStructure(?, ?, ?, ?, ?)', 'building_structure');
            if (!centralStructure?.length) {
                console.warn('No central structure found.');
                return pricing;
            }
            const { end_length, distance_on_center } = centralStructure[0];
            if (central_height) {
                const centralLengthArrayFull = await this.getSideHeightCostsLength(central_length, end_length, distance_on_center, central_map_id ?? map_id);
                const centralNewLength = central_utility_length ? central_length - central_utility_length : central_length;
                const centralLengthArray = await this.getSideHeightCostsLength(centralNewLength, end_length, distance_on_center, central_map_id ?? map_id);
                const centralLengthArrayFullString = `'${centralLengthArrayFull.join("','")}'`;
                const centralLengthArrayString = `'${centralLengthArray.join("','")}'`;
                const [centralSideFull, centralSide, centralTrusses, centralEnd] = await Promise.all([
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, central_length, centralLengthArrayFullString], 'getSidePrice(?, ?, ?, ?)', 'central_side_full_length'),
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, centralNewLength, centralLengthArrayString], 'getSidePrice(?, ?, ?, ?)', 'central_side'),
                    ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_width, central_height, central_length, centralLengthArrayFullString], 'getTrussUpgrade(?, ?, ?, ?, ?)', 'central_trusses'),
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
                const centralUtilityArray = await this.getSideHeightCostsLength(central_utility_length, end_length, distance_on_center, central_map_id ?? map_id);
                const centralUtilityArrayString = `'${centralUtilityArray.join("','")}'`;
                const centralUtilitySide = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([central_map_id, central_height, central_utility_length, centralUtilityArrayString], 'getSidePrice(?, ?, ?, ?)', 'central_utility_side');
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
    static safeStringParam(value, collation = 'utf8mb4_general_ci') {
        if (!value || value.trim() === '') {
            return `'' COLLATE ${collation}`;
        }
        return `'${value}' COLLATE ${collation}`;
    }
    mergeComponents(pricing, components) {
        logger.info("[mergeComponents] Starting merge with components:", Object.keys(components));
        for (const [key, value] of Object.entries(components)) {
            if (Array.isArray(value)) {
                if (this.ARRAY_FIELDS.has(key)) {
                    pricing[key] = value.length > 0 ? value : [];
                    logger.info(`[mergeComponents] Merged ${key}: array with ${value.length} items`);
                }
                else {
                    pricing[key] = value.length > 0 ? value[0] : null;
                    logger.info(`[mergeComponents] Merged ${key}: ${value.length > 0 ? 'first element' : 'null'}`);
                }
            }
            else {
                pricing[key] = value;
                logger.info(`[mergeComponents] Merged ${key}: non-array value`);
            }
        }
        logger.info("[mergeComponents] Merge complete. Final pricing keys:", Object.keys(pricing));
    }
    applyPricingMultipliers(pricing, params) {
        logger.info("[applyPricingMultipliers] ====== APPLYING MULTIPLIERS ======");
        const sqft = params.width * params.length;
        const gaugeMultiplier = params.gauge === 12 ? 1.15 : params.gauge === 16 ? 0.95 : 1.0;
        logger.info(`[applyPricingMultipliers] Gauge: ${params.gauge}ga × ${gaugeMultiplier}`);
        const buildingTypeMultipliers = {
            'garage': 1.0,
            'carport': 0.85,
            'barn': 1.2,
            'commercial': 1.25,
            'rv cover': 0.8,
            'rv garage': 1.1,
        };
        const buildingMultiplier = buildingTypeMultipliers[params.building_type?.toLowerCase() || 'garage'] || 1.0;
        logger.info(`[applyPricingMultipliers] Building type "${params.building_type}": × ${buildingMultiplier}`);
        const roofTypeMultipliers = {
            1: 1.0,
            2: 0.95,
            3: 0.90,
        };
        const roofMultiplier = roofTypeMultipliers[params.roof_id] || 1.0;
        logger.info(`[applyPricingMultipliers] Roof ID ${params.roof_id}: × ${roofMultiplier}`);
        const baseHeight = 10;
        const heightPremium = params.height > baseHeight
            ? (params.height - baseHeight) * (sqft * 0.50)
            : 0;
        logger.info(`[applyPricingMultipliers] Height premium: $${heightPremium}`);
        const combinedMultiplier = gaugeMultiplier * buildingMultiplier * roofMultiplier;
        pricing.base_price_regular = (pricing.base_price_regular ?? 0) * combinedMultiplier;
        pricing.base_price_box = (pricing.base_price_box ?? 0) * combinedMultiplier;
        pricing.base_price_vertical = (pricing.base_price_vertical ?? 0) * combinedMultiplier;
        logger.info(`[applyPricingMultipliers] Combined multiplier: ${combinedMultiplier}`);
        logger.info(`[applyPricingMultipliers] Base prices after multiplier:`);
        logger.info(`  - Regular: $${pricing.base_price_regular}`);
        logger.info(`  - Box: $${pricing.base_price_box}`);
        logger.info(`  - Vertical: $${pricing.base_price_vertical}`);
        if (heightPremium > 0) {
            pricing.height_premium = heightPremium;
            pricing.base_price_regular += heightPremium;
            pricing.base_price_box += heightPremium;
            pricing.base_price_vertical += heightPremium;
            logger.info(`[applyPricingMultipliers] Added height premium: $${heightPremium}`);
        }
        logger.info("[applyPricingMultipliers] ====== END MULTIPLIERS ======");
    }
}
exports.PriceServiceImpl = PriceServiceImpl;
function Enforce() {
}
//# sourceMappingURL=PriceServiceImpl.js.map