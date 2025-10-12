import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IBuildingStructures {
    id?: number;
    map_id: number;
    building_id: number;
    roof_id: number;
    frame_length: boolean;
    min_start_length: number;
    start_length: number;
    end_length: number;
    distance_on_length: number;
    start_height: number;
    min_height: number;
    max_height: number;
    min_start_width: number;
    min_width: number;
    max_width: number;
    fixed_width?: string;
    distance_on_width: number;
    building_max_length: number;
    conditions?: string;
    distance_on_center?: number;
    default_gauge: number;
    created_at?: number;
    updated_at?: number;
}

interface BuildingStructuresCreationAttributes extends Omit<IBuildingStructures, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "building_structures", timestamps: false })
export default class BuildingStructures extends Model<IBuildingStructures, BuildingStructuresCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare building_id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare roof_id: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare frame_length: boolean;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare min_start_length: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare start_length: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare end_length: number;

    @Default(5)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare distance_on_length: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare start_height: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare min_height: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare max_height: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare min_start_width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare min_width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare max_width: number;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare fixed_width?: string;

    @Default(2)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare distance_on_width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare building_max_length: number;

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare conditions?: string;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_center?: number;

    @Default(14)
    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare default_gauge: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
