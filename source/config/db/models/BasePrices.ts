import {  Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IBasePrices {
    id?: number;
    structure: string;
    map_id: number;
    regular_cost: number;
    box_style_cost: number;
    vertical_roof_cost: number;
    gauge: number;
    created_at?: number;
    updated_at?: number;
}

interface BasePricesCreationAttributes extends Omit<IBasePrices, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "base_prices", timestamps: false })
export default class BasePrices extends Model<IBasePrices, BasePricesCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(10), allowNull: false })
    declare structure: string;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare regular_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare box_style_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare vertical_roof_cost: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare gauge: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
