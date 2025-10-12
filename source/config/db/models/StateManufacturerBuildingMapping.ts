import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IStateManufacturerBuildingMapping {
    map_id: number;
    manufacturer_id?: number | null;
    state_ids?: string | null;
    building_id?: number | null;
    lean_to_building_id?: number | null;
    region_id?: number | null;
    heavy_snow: number;
    default_building?: number;
    is_new_leg_height_structure: number;
}

interface StateManufacturerBuildingMappingCreationAttributes extends Omit<IStateManufacturerBuildingMapping, "map_id"> {}

@Table({ tableName: "state_manufacturer_building_mapping", timestamps: false })
export default class StateManufacturerBuildingMapping extends Model<
    IStateManufacturerBuildingMapping,
    StateManufacturerBuildingMappingCreationAttributes
> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare manufacturer_id?: number | null;

    @Column({ type: DataType.STRING(255), allowNull: true  })
    declare state_ids?: string | null;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare building_id?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare lean_to_building_id?: number | null;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare region_id?: number | null;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare heavy_snow: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: true })
    declare default_building?: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false, comment: "0:No,1:Yes" })
    declare is_new_leg_height_structure: number;
}
