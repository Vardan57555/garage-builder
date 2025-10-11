import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IGarageDoorColors {
    id?: number;
    name?: string | null;
    manufacturer_id: number;
    red_value?: number | null;
    green_value?: number | null;
    blue_value?: number | null;
    hex_value?: string | null;
    cost?: number | null;
    percentage_of_cost?: number | null;
}

interface GarageDoorColorsCreationAttributes extends Omit<IGarageDoorColors, "id"> {}

@Table({ tableName: "garage_door_colors", timestamps: false })
export default class GarageDoorColors extends Model<IGarageDoorColors, GarageDoorColorsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(25), allowNull: true })
    declare name?: string | null;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare red_value?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare green_value?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare blue_value?: number | null;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare hex_value?: string | null;

    @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
    declare cost?: number | null;

    @Column({ type: DataType.TINYINT, allowNull: true })
    declare percentage_of_cost?: number | null;
}
