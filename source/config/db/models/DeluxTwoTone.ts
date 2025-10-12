import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IDeluxTwoTone {
    id?: number;
    name: string;
    label?: string;
    length: number;
    cost: number;
    map_id: number;
    on_end_horizontal?: number;
    on_end_vertical?: number;
    on_side_horizontal?: number;
    on_side_vertical?: number;
    width?: number;
    horizontal_cost_type: "$" | "%" | "sqft" | "ft";
    vertical_cost_type: "$" | "%" | "sqft" | "ft";
    horizontal_price_of?: string;
    vertical_price_of?: string;
}

interface DeluxTwoToneCreationAttributes
    extends Omit<IDeluxTwoTone, "id"> {}

@Table({ tableName: "delux_two_tone", timestamps: false })
export default class DeluxTwoTone extends Model<IDeluxTwoTone, DeluxTwoToneCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "metal" })
    declare name: string;

    @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: "Metal" })
    declare label?: string;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 })
    declare on_end_horizontal?: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 })
    declare on_end_vertical?: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 })
    declare on_side_horizontal?: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0 })
    declare on_side_vertical?: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 })
    declare width?: number;

    @Column({
        type: DataType.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$"
    })
    declare horizontal_cost_type: "$" | "%" | "sqft" | "ft";

    @Column({
        type: DataType.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$"
    })
    declare vertical_cost_type: "$" | "%" | "sqft" | "ft";

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare horizontal_price_of?: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare vertical_price_of?: string;
}
