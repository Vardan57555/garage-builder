import {
    Column,
    DataType,
    Default,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";

interface IColor {
    id?: string;
    color_id: string;
    sheet_name?: string;
    sheet_label?: string;
    name?: string;
    image_name?: string;
    red_value?: number;
    green_value?: number;
    blue_value?: number;
    manufacturer_id?: number;
    hex_value?: string;
    percentage_of_cost: boolean;
    price_of?: string;
    applicable_on?: string;
    cost: number;
    color_add_ons?: string;
    applied_on?: string;
    created_at: number;
    updated_at: number;
}

interface ColorCreationAttributes extends Omit<IColor, "color_id" | "created_at" | "updated_at"> {}

@Table({ tableName: "colors", timestamps: false })
export default class Color extends Model<IColor, ColorCreationAttributes> {
    @PrimaryKey
    @Default(uuidv4)
    @Column({ type: DataType.STRING, allowNull: false })
    declare color_id: string;

    @Default("metal")
    @Column({ type: DataType.STRING, allowNull: true })
    declare sheet_name: string;

    @Default("Metal")
    @Column({ type: DataType.STRING, allowNull: true })
    declare sheet_label: string;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare name: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare image_name: string;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare red_value: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare green_value: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare blue_value: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare manufacturer_id: number;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare hex_value: string;

    @Default(false)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare percentage_of_cost: boolean;

    @Column({ type: DataType.STRING, allowNull: true })
    declare price_of: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare applicable_on: string;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare color_add_ons: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare applied_on: string;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: () => Date.now() })
    declare created_at: number;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: () => Date.now() })
    declare updated_at: number;
}
