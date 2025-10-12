import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IManufacturer {
    id: number;
    name: string;
    logo?: string | null;
    side_lean_to: number;
    end_lean_to: number;
    gable_lean_to: number;
    wrap_around: number;
    free_standing_lean_to: number;
    gable_building_without_pricing: boolean;
    allow_storage_movement: number;
}

interface ManufacturerCreationAttributes extends Omit<IManufacturer, "id"> {}

@Table({ tableName: "manufacturers", timestamps: false })
export default class Manufacturer extends Model<IManufacturer, ManufacturerCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare logo?: string | null;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 1 })
    declare side_lean_to: number;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare end_lean_to: number;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare gable_lean_to: number;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare wrap_around: number;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare free_standing_lean_to: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare gable_building_without_pricing: boolean;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 1 })
    declare allow_storage_movement: number;
}
