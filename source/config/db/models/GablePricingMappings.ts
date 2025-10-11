import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IGablePricingMappings {
    id?: number;
    map_id: number;
    gable_map_id: number;
    min_width: number;
    max_width: number;
    distance_on_width: number;
    min_height: number;
    max_height: number;
    distance_on_height: number;
    min_length?: number;
    max_length?: number;
    distance_on_length?: number;
}

interface GablePricingMappingsCreationAttributes extends Omit<IGablePricingMappings, "id"> {}

@Table({ tableName: "gable_pricing_mappings", timestamps: false })
export default class GablePricingMappings extends Model<IGablePricingMappings, GablePricingMappingsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare gable_map_id: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare min_width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare max_width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare distance_on_width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare min_height: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare max_height: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare distance_on_height: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare min_length?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare max_length?: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare distance_on_length?: number;
}
