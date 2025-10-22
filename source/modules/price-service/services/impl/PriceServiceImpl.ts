import {InstantiationError} from "@errors/InstantiationError";
import {ValidationTypes} from "@common/io/enum/ResponseTypes";
import {ValidationResult} from "joi";
import {ValidationError} from "@errors/ValidationError";
import {PriceService} from "@modules/price-service/services/PriceService";
import {ProcedureExecutor} from "@utils/procedure/ProcedureExecutor";
import {PriceDataValidator} from "@modules/price-service/services/validator/PriceDataValidator";
import {IBuildingStructure} from "@modules/building-service/services/io/IBuildingStructure";
import {IManufacturer} from "@modules/manufacturer-service/service/io/IManufacturer";
import {ServerError} from "@errors/ServerError";
import {
    FetchComponentsParams, GetUtilityPricingParams, IAddon, IAnchor,
    IBasePrice,
    IBaseStructureParams,
    IEndCost, IFetchPricesParams, IFullStructureParams,
    IPrice, IPricing,
    IPricingParams,
    ISideHeight, ISidePriceResult, IUtilityPricingResult, ProcedureConfig
} from "@modules/price-service/services/io/IPrice";
import {Constants} from "@common/io/Constants";
import {MySQLManager} from "@config/db/MySqlManager";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class PriceServiceImpl implements PriceService
{

    /**
     * The singleton instance of `PriceService`.
     * @private
     */

    public static instance: PriceService;

    private static readonly BASE_KEYS: string[] = [
        'anchors_cost', 'truss_name','garage_door','garage_door_frameout','walkin_door_frameout',
        'window_frameout','end','end_cross_bracing','insulation','certificate',
        'full_length_panel','side_cross_bracing','braces','bows','addons',
        'addons_width','roof_pitch','additional_features','connection_fees','trusses','full_length_side'
    ];

    private readonly ARRAY_FIELDS = new Set(['addons', 'addons_width', 'anchors_cost', 'bows', 'braces', 'trusses']);

    private static readonly PROCEDURE_MAP: Record<string, ProcedureConfig> =
        {
            end: ({ map_id, width, height }) => [
                [map_id, height, width],
                'getEachEndClose(?, ?, ?)'
            ],
                gable_end: ({ map_id, width, side_end_name }) => {
                    const safeSideEndName = this.safeStringParam(side_end_name); // defaults to utf8mb4_general_ci
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

            insulation: ({map_id, both_side, both_ends, roof_only, utility_end, utility_side, utility_roof, utility_opposite_side, pitch_side, pitch_type, slope_side, utility_slope_side }) => [
                [map_id, both_side, both_ends, roof_only, utility_end, utility_side, utility_roof, utility_opposite_side, pitch_side, pitch_type, slope_side, utility_slope_side],
                'getInsulation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ],

            certificate: ({ map_id, width, height, length, structureString }) => [
                [map_id, width, height, length, structureString],
                'getCertificate(?, ?, ?, ?, ?)'
            ],

            full_length_panel: ({ map_id, length, structureString, side_end_name }) => [
                [map_id, length, structureString, side_end_name],
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

            roof_pitch: ({ map_id, width, length, structureString }) => [
                [map_id, width, length, structureString],
                'getRoofPitch(?, ?, ?, ?)'
            ],

            connection_fees: ({ map_id, width, height, length, structureString, length_without_wrap, length_without_wrap_string }) => [
                [map_id, width, height, length, structureString, length_without_wrap, length_without_wrap_string],
                'getConnectionFees(?, ?, ?, ?, ?, ?, ?)'
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
            getMapIdByStateName: (({ state_name }: any) => [
                [state_name],
                'getMapIdByStateName(?)'
            ]) as ProcedureConfig,
            window_frameout: ({ map_id }) => [
                [map_id],
                'getWindow(?)'
            ],
        };


    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceService.getInstance() instead of new.");
        }

    }

    /**
     * Gets the singleton instance of PriceService.
     *
     * @returns The singleton instance of PriceService.
     */

    public static getInstance(): PriceService
    {
        if(!PriceServiceImpl.instance)
        {
            PriceServiceImpl.instance = new PriceServiceImpl(Enforce);
        }

        return PriceServiceImpl.instance;
    }

    /**
     * Calculates comprehensive building pricing, including base structure, components,
     * utility sections, central structures, and applicable addons.
     * @param params - An object containing all parameters required for pricing calculation.
     * @returns An object
     * @throws {ServerError.INTERNAL} If any procedure call or calculation fails.
     */

    public async fetchBuildingPricingWithUtility(params: IPricingParams)
    {
        try
        {
            const [{ finalWidth, finalLength, finalHeight }, { manufacturer, buildingStructureFull }] =
                await Promise.all([
                    this.calculateFinalDimensions(params),
                    this.fetchBaseData(
                        params.map_id!,
                        params.roof_id,
                        params.width,
                        params.height,
                        params.length
                    )
                ]);

            if (!buildingStructureFull.length)
            {
                return {
                    status: false,
                    message: 'The given dimension is not available for the building'
                };
            }

            const pricing: Record<string, any> = {
                building_to_maxlength: finalLength,
                manufacturer,
                building_structure: buildingStructureFull
            };

            const componentKeys: string[] = this.getComponentKeys(params.single_slope_height);

            const [components, utilityPricing, centralPricing] = await Promise.all([
                this.fetchComponentsPricing({
                    map_id: params.map_id!,
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
                    ? this.getUtilityPricing({...params, height: finalHeight, utility_length: params.utility_length, length: finalLength, buildingStructureFull})
                    : Promise.resolve(null),
                params.central_map_id
                    ? this.getCentralStructurePricing(params)
                    : Promise.resolve(null)
            ]);

            this.mergeComponents(pricing, components);

            if (utilityPricing)
            {
                Object.assign(pricing, utilityPricing);
            }

            if (centralPricing)
            {
                Object.assign(pricing, centralPricing);
            }

            this.applyAddons(pricing);
            this.adjustConnectionFees(pricing, params.is_barn);

            return pricing;
        }
        catch (error)
        {
            logger.error(`[Pricing] Error calculating pricing`, error);
            throw new ServerError(ServerError.INTERNAL, `Failed to calculate pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves and calculates all pricing data for a given building configuration.
     * @param map_id - The map ID used for procedure lookups.
     * @param height - The height of the building.
     * @param building_type - The type of building (`garage`, `commercial`, etc.).
     * @param gauge - The gauge used to filter base prices.
     * @returns A promise resolving to an array of validated prices (`IPrice[]`) for the building,
     * @throws {ServerError} If any database procedure call or calculation fails.
     */

    public async fetchAllPrices({ map_id, height, building_type, gauge }: IFetchPricesParams): Promise<IPrice | IPrice[]>
    {
        try
        {
            const widthArray: number[] = [];
            const lengthArray: number[] = [];

            const basePrices: IBasePrice[] = await ProcedureExecutor.getProcedureData<IBasePrice>(
                [map_id, gauge],
                'getBasicPrice(?, ?)',
                'base_prices'
            );

            basePrices.forEach((record: IBasePrice) =>
            {
                if (record.structure)
                {
                    const [w, l] = record.structure.split('x').map(Number);
                    widthArray.push(w);
                    lengthArray.push(l);
                }
            });

            if ((building_type === 'garage' || building_type === 'commercial') && height > 0)
            {
                const sideCosts: ISideHeight[] = await ProcedureExecutor.getProcedureData<ISideHeight>(
                    [map_id, lengthArray, height],
                    'getSideHeights(?, ?, ?)',
                    'side_heights'
                );

                basePrices.forEach((record: IBasePrice) =>
                {
                    if (record.structure)
                    {
                        const length: number = Number(record.structure.split('x')[1]);
                        sideCosts.forEach((side: ISideHeight) =>
                        {
                            if (Number(side.length) === length)
                            {
                                let sideCloseCost: number = (side.side_close_cost > 0 ? side.side_close_cost : side.vertical_side_cost) * 2 + side.leg_height_cost;
                                ['regular_cost', 'box_style_cost', 'vertical_roof_cost'].forEach(key => {
                                    record[key] = record[key] > 0 ? record[key] + sideCloseCost : 0;
                                });
                            }
                        });
                    }
                });
            }

            if ((building_type === 'garage' || building_type === 'commercial') && height > 0)
            {
                const endCosts: IEndCost[] = await ProcedureExecutor.getProcedureData<IEndCost>(
                    [map_id, height, widthArray],
                    'getEachEndClose(?, ?, ?)',
                    'end_close'
                );

                basePrices.forEach((record: IBasePrice) =>
                {
                    if (record.structure)
                    {
                        const width: number = Number(record.structure.split('x')[0]);
                        endCosts.forEach(end =>
                        {
                            if (Number(end.width) === width)
                            {
                                const endCloseCost: number = end.end_close_cost > 0 ? end.end_close_cost : end.vertical_ends_cost;
                                ['regular_cost', 'box_style_cost', 'vertical_roof_cost'].forEach(key => {
                                    record[key] = record[key] > 0 ? record[key] + endCloseCost * 2 : 0;
                                });
                            }
                        });
                    }
                });
            }

            return this.validateOutput(basePrices, ValidationTypes.SINGLE);
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `failed to get all prices ${error.message}`);
        }
    }

    /**
     * Retrieves an array of side height lengths used for pricing calculations.
     * @param length - The requested length of the side.
     * @param maxLength - The maximum allowed length before splitting is required.
     * @param distanceOnCenter - The distance between centers used for calculation.
     * @param mapId - The map ID for procedure lookup.
     * @returns A promise resolving to an array of numbers representing valid side lengths.
     */

    private async getSideHeightCostsLength(length: number, maxLength: number, distanceOnCenter: number, mapId: number): Promise<number[]>
    {
        if (length <= maxLength)
        {
            return [length];
        }

        const sql = 'CALL getSideHeightCostsLenght_(?, ?, ?)';

        try
        {
            const [result]: any = await MySQLManager.getInstance().sequelize.query(sql, {
                replacements: [distanceOnCenter, length, mapId],
                type: 'SELECT'
            });

            const combs = result?.[0];

            if (combs?.combinations)
            {
                return combs.combinations.split(',').map((l: string) => Number(l));
            }

            return [length];
        }
        catch (error)
        {
           throw new ServerError(ServerError.INTERNAL, `failed to get side height costs length ${error.message}`);
        }
    }


    /**
     * Retrieves the base building structure for a given map and roof ID.
     * Returns default dimensions if no structure is found.
     * @param params - An object containing parameters for the structure lookup.
     * @returns A promise resolving to a single building structure (`IBuildingStructure`),
     * @throws {ServerError.INTERNAL} If the database procedure call fails.
     */

    private async getBaseStructure({ map_id, roof_id }: IBaseStructureParams)
    {
        const safeMapId: number = map_id ?? 0;
        const safeRoofId: number  = roof_id ?? 0;

        const structures: IBuildingStructure[] = await ProcedureExecutor.getProcedureData<IBuildingStructure>(
            [safeMapId, safeRoofId, null, null, null],
            'getBuildingStructure',
            'building_structure'
        );

        return structures[0] || { min_width: 12, start_length: 12, min_height: 8 };
    }

    /**
     * Retrieves manufacturer details for a given map ID.
     * @param map_id - The map ID for which to fetch manufacturer information.
     * @returns A promise resolving to an array of manufacturer objects (`IManufacturer[]`).
     * @throws {ServerError} If the database procedure call fails.
     */

    private async getManufacturer(map_id: number)
    {
        return await ProcedureExecutor.getProcedureData<IManufacturer>(
            [map_id],
            'getManufacture(?)',
            'manufacturer'
        );
    }

    /**
     * Retrieves the full building structure details from the database.
     * @param params - An object containing parameters for the structure lookup.
     * @returns A promise resolving to an array of building structure objects (`IBuildingStructure[]`).
     * @throws {ServerError} If the database procedure call fails.
     */

    private async getFullStructure({ map_id, roof_id, width, height, length }: IFullStructureParams)
    {
        const safeMapId: number  = map_id ?? 0;
        const safeRoofId: number  = roof_id ?? 0;
        const safeWidth: number  = width ?? 0;
        const safeHeight: number  = height ?? 0;
        const safeLength: number  = length ?? 0;

        return await ProcedureExecutor.getProcedureData<IBuildingStructure>(
            [safeMapId, safeRoofId, safeWidth, safeHeight, safeLength],
            'getBuildingStructure',
            'building_structure'
        );
    }

    /**
     * Returns a list of component keys to fetch for a building,
     * optionally including single-slope components if a slope height is provided.
     * @param single_slope_height - Optional height of a single-slope section. If provided,
     * @returns An array of component keys (`string[]`) to be used for fetching pricing data.
     */

    private getComponentKeys(single_slope_height?: number): string[]
    {
        return [
            ...PriceServiceImpl.BASE_KEYS,
            ...(single_slope_height ? ['trusses_slope'] : [])
        ];
    }

    /**
     * @param length - The total length of the section to process.
     * @param end_length - The end section length used for calculation.
     * @param distance_on_center - Distance between centers used for length calculation.
     * @param map_id - The map ID for procedure lookup.
     * @throws {ServerError} If the side length calculation procedure fails.
     */

    private async buildLengthString(length: number, end_length: number, distance_on_center: number, map_id: number): Promise<string>
    {
        const lengths: number[] = await this.getSideHeightCostsLength(length, end_length, distance_on_center, map_id);
        return `'${lengths.join("','")}'`;
    }

    /**
     * Retrieves pricing for the utility section, including side panels, extra panels, and optional single-slope sides.
     *
     * @param params - Object containing map ID, dimensions, full building structure, and optional single slope height.
     * @returns An object containing pricing for sides, extra panels, utility sides, and utility single-slope sides.
     * @throws {ServerError} If any procedure execution fails.
     */

    private async getUtilityPricing(params: GetUtilityPricingParams): Promise<IUtilityPricingResult>
    {
        const { map_id, height, length, utility_length, buildingStructureFull, single_slope_height } = params;
        const { end_length, distance_on_center, side_end_name } = buildingStructureFull[0];

        const buildLengthData = async (len: number) =>
            this.buildLengthString(len, end_length, distance_on_center, map_id);

        const newLength = length - utility_length;
        const sideLengthString = await buildLengthData(newLength);
        const utilityLengthString = await buildLengthData(utility_length);

        const [side, panel, utility_side] = await Promise.all([
            this.getProcedure<ISidePriceResult>([map_id, height, newLength, sideLengthString], 'getSidePrice(?, ?, ?, ?)', 'side'),
            this.getProcedure<ISidePriceResult>([map_id, newLength, sideLengthString, side_end_name], 'getExtraPanel(?, ?, ?, ?)', 'panel'),
            this.getProcedure<ISidePriceResult>([map_id, height, utility_length, utilityLengthString], 'getSidePrice(?, ?, ?, ?)', 'utility_side')
        ]);

        const utility_slope_height = single_slope_height
            ? this.transformUtilitySlopeHeight(
                await this.getProcedure<ISidePriceResult>(
                    [map_id, single_slope_height, utility_length, utilityLengthString],
                    'getSidePrice(?, ?, ?, ?)',
                    'utility_slope_height'
                ),
                utility_length
            )
            : [];

        return { side, panel, utility_side, utility_slope_height };
    }


    /**
     * @param params - An object containing the building parameters such as width, length, height, map_id, and roof_id.
     * @returns An object with the finalized width, length, and height values.
     * @throws {ServerError} If fetching the base structure fails or any internal calculation errors occur.
     */

    private async calculateFinalDimensions(params: IPricingParams)
    {
        const baseStructure: { min_width: number; start_length: number; min_height: number } = await this.getBaseStructure({ map_id: params.map_id, roof_id: params.roof_id });

        return {
            finalWidth: Math.max(params.width || 0, baseStructure.min_width),
            finalLength: Math.max(params.length || 0, baseStructure.start_length),
            finalHeight: Math.max(params.height || 0, baseStructure.min_height)
        };
    }

    /**
     * @param map_id - The ID of the map for which data is being fetched.
     * @param roof_id - The ID of the roof type.
     * @param width - The width of the building.
     * @param height - The height of the building.
     * @param length - The length of the building.
     * @returns An object containing the manufacturer details and full building structure.
     * @throws {ServerError} If any of the data retrieval operations fail.
     */

    private async fetchBaseData(map_id: number, roof_id: number, width: number, height: number, length: number)
    {
        const [manufacturer, buildingStructureFull] = await Promise.all([
            this.getManufacturer(map_id),
            this.getFullStructure({ map_id, roof_id, width, height, length })
        ]);

        return { manufacturer, buildingStructureFull };
    }

    /**
     * @param params - An object containing building parameters, full structure data, and a list of component keys to fetch pricing for.
     * @returns An object where each key corresponds to a component and the value contains its pricing data.
     * @throws {Error} If a component key is unknown or if any procedure execution fails.
     */

    private async fetchComponentsPricing(params: FetchComponentsParams & { componentKeys: string[] })
    {
        const components: Awaited<[string, unknown[]]>[] = await Promise.all(
            params.componentKeys.map(async key =>
            {
                const procedureFn = PriceServiceImpl.PROCEDURE_MAP[key];

                if (!procedureFn)
                {
                    throw new Error(`Unknown component key: ${key}`)
                }

                const [args, query] = procedureFn({
                    ...params,
                    structureString: `'${params.buildingStructureFull.map(s => `${params.width}x${s.end_length}`).join("','")}'`
                });

                const data: unknown[] = await ProcedureExecutor.getProcedureData(args, query, key);
                return [key, data];
            })
        );
        return Object.fromEntries(components);
    }

    /**
     * Applies additional pricing options (addons) to the given pricing object.
     * @param pricing - The pricing object to which addon values will be applied.
     */

    private applyAddons(pricing: Record<string, any>)
    {
        const { checkbox, checkboxQuantity, checkboxQuantityDropdown } = this.processAddons(pricing);
        pricing.checkbox = checkbox;
        pricing.checkbox_quantity = checkboxQuantity;
        pricing.checkbox_quantity_dropdown = checkboxQuantityDropdown;
    }

    /**
     * @param pricing - The pricing object containing connection fees to adjust.
     * @param is_barn - Optional flag indicating if the building is a barn ('yes' to retain fees).
     */

    private adjustConnectionFees(pricing: Record<string, any>, is_barn?: boolean)
    {
        if (!is_barn)
        {
            pricing.connection_fees?.forEach(fee => fee.cost = 0);
        }
    }

    /**
     * Fetches and calculates pricing details for a central building structure,
     * including side costs, trusses, ends, and optional utility sections.
     * @param params - An object containing central structure configuration values.
     * @throws {ServerError} If any database procedure call or calculation fails.
     */

    private async getCentralStructurePricing(params: IPricingParams): Promise<Record<string, any>>
    {
        const pricing: Record<string, any> = {};

        const { central_map_id, roof_id, central_height, central_length, central_width, central_utility_length, map_id } = params;
        try
        {
            const centralStructure = await ProcedureExecutor.getProcedureData<any>(
                [central_map_id ?? 0, roof_id ?? 0, central_width, central_height, central_length],
                'getBuildingStructure(?, ?, ?, ?, ?)',
                'building_structure'
            );

            if (!centralStructure?.length)
            {
                console.warn('No central structure found.');
                return pricing;
            }

            const { end_length, distance_on_center } = centralStructure[0];

            if (central_height)
            {
                const centralLengthArrayFull: number[] = await this.getSideHeightCostsLength(central_length, end_length, distance_on_center, map_id);
                const centralNewLength: number = central_utility_length ? central_length - central_utility_length : central_length;
                const centralLengthArray: number[] = await this.getSideHeightCostsLength(centralNewLength, end_length, distance_on_center, map_id);

                const [
                    centralSideFull,
                    centralSide,
                    centralTrusses,
                    centralEnd
                ] = await Promise.all([
                    ProcedureExecutor.getProcedureData<ISideHeight>(
                        [central_map_id, central_height, central_length, centralLengthArrayFull],
                        'getSidePrice(?, ?, ?, ?)',
                        'central_side_full_length'
                    ),
                    ProcedureExecutor.getProcedureData<ISideHeight>(
                        [central_map_id, central_height, centralNewLength, centralLengthArray],
                        'getSidePrice(?, ?, ?, ?)',
                        'central_side'
                    ),
                    ProcedureExecutor.getProcedureData<IBasePrice>(
                        [central_map_id, central_width, central_height, central_length, centralLengthArrayFull],
                        'getTrussUpgrade(?, ?, ?, ?, ?)',
                        'central_trusses'
                    ),
                    ProcedureExecutor.getProcedureData<IEndCost>(
                        [central_map_id, central_height, central_width],
                        'getEachEndClose(?, ?, ?)',
                        'central_end'
                    )
                ]);

                Object.assign(pricing, {
                    central_side_full_length: centralSideFull,
                    central_side: centralSide,
                    central_trusses: centralTrusses,
                    central_end: centralEnd
                });
            }

            if (central_utility_length)
            {
                const centralUtilityArray: number[] = await this.getSideHeightCostsLength(
                    central_utility_length,
                    end_length,
                    distance_on_center,
                    map_id
                );

                const centralUtilitySide: ISideHeight[] = await ProcedureExecutor.getProcedureData<ISideHeight>(
                    [central_map_id, central_height, central_utility_length, centralUtilityArray],
                    'getSidePrice(?, ?, ?, ?)',
                    'central_utility_side'
                );

                centralUtilitySide.forEach((side: ISideHeight) =>
                {
                    side['utility_length'] = central_utility_length;
                });

                pricing['central_utility_side'] = centralUtilitySide;
            }

            return pricing;
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to get central structure pricing: ${error.message}`);
        }
    }

    /**
     * Processes the pricing object to extract and organize addon-related data,
     * including checkboxes, quantity-based options, and dropdowns for selectable items.
     * @param pricing - The pricing object (`IPricing`) containing all addon, brace, truss, and anchor information to be processed.
     * @throws {Error} If required pricing fields are missing or improperly structured.
     */

    private processAddons(pricing: IPricing)
    {
        const processAddons = (addons: IAddon[] = [], type: "side" | "end") =>
        {
            const checkbox = addons.flatMap((addon: IAddon) =>
                Object.keys(addon)
                    .filter((key: string) => !Constants.ESCAPE_KEYS.includes(key))
                    .map((key: string) => ({
                        name: key,
                        label: Constants.LABEL_NAMES[key] || key,
                        cost: addon[key]
                    }))
            );

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

        const checkboxQuantity: any[] = [];
        const checkboxQuantityDropdown: any[] = [];

        if (pricing.bows?.length)
        {
            checkboxQuantity.push({
                name: "bows",
                label: "Extra Bows",
                cost: pricing.bows[0].cost
            });
        }

        pricing.anchors_cost?.forEach((anchor: IAnchor) =>
            checkboxQuantity.push({
                name: anchor.anchor_id,
                label: anchor.name,
                is_concrete: anchor.is_concrete,
                cost: anchor.cost
            })
        );

        const processOptions = (items: any[] = [], key: string) =>
        {
            const options = items.filter((item) => item[key] > 0);

            if (options.length)
            {
                checkboxQuantityDropdown.push({
                    name: key,
                    label: `Extra ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                    options
                });
            }
            else
            {
                items.forEach((item) =>
                    checkboxQuantity.push({
                        name: key,
                        label: `Extra ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                        cost: item.cost
                    })
                );
            }
        };

        processOptions(pricing.braces, "bracing_feet");
        processOptions(pricing.trusses, "truss");

        return { checkbox, checkboxQuantity, checkboxQuantityDropdown };
    }


    /**
     * @template T - The expected type of the procedure result.
     * @param params - Array of parameters to pass to the procedure.
     * @param procedureName - Name of the stored procedure to execute.
     * @param key - The key representing which part of the result to return.
     * @returns Promise resolving to an array of procedure results of type T.
     * @throws ServerError if the procedure execution fails.
     */

    private async getProcedure<T>(params: any[], procedureName: string, key: string): Promise<T[]>
    {
        return ProcedureExecutor.getProcedureData(params, procedureName, key);
    }

    /**
     * @param data - Array of side price results from the procedure.
     * @param utility_length - The utility length to attach to each result.
     * @returns Array of side price results with the utility length included.
     */

    private transformUtilitySlopeHeight(data: ISidePriceResult[], utility_length: number): (ISidePriceResult & { utility_length: number })[]
    {
        return data.map(item => ({
            ...item,
            utility_length
        }));
    }

    /**
     * Validates the output model and returns the validated model or throws an error if validation fails.
     *
     * @returns The validated model.
     * @throws ValidationError if output validation fails.
     * @param price
     * @param type
     */

    public validateOutput(price: {} | {}[], type: ValidationTypes = ValidationTypes.SINGLE): IPrice | IPrice[]
    {
        const validationMethods: Partial<Record<ValidationTypes, (data: {}) => ValidationResult>> = {
            [ValidationTypes.SINGLE]: PriceDataValidator.outputValidate,
            [ValidationTypes.ALL]: PriceDataValidator.outputArrayValidate
        };

        const outputValidation: ValidationResult = validationMethods[type](price);

        if (outputValidation.error)
        {
            throw new ValidationError(ValidationError.OUTPUT, outputValidation.error.message);
        }

        return outputValidation.value;
    }

    /**
     * @param value - The input string value to format. If undefined or empty, an empty SQL string is returned.
     * @param collation - The SQL collation to apply to the string value (defaults to `'utf8mb4_general_ci'`).
     * @returns {string} A safely formatted SQL string literal with the specified collation applied.
     */

    private static safeStringParam(value?: string, collation: string = 'utf8mb4_general_ci'): string
    {
        if (!value || value.trim() === '')
        {
            return `'' COLLATE ${collation}`;
        }

        return `'${value}' COLLATE ${collation}`;
    }

    /**
     * @param pricing - The target pricing object to be updated.
     * @param components - The collection of component key-value pairs to merge into the pricing data.
     * @returns {void}
     */

    private mergeComponents(pricing: Record<string, any>, components: Record<string, unknown | unknown[]>): void
    {
        for (const [key, value] of Object.entries(components))
        {
            if (Array.isArray(value) && !this.ARRAY_FIELDS.has(key))
            {
                pricing[key] = value[0] ?? null;
            }
            else
            {
                pricing[key] = value;
            }
        }
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
