import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IColoredScrew {
    colored_screw_id?: number;
    map_id: number;
    start_width?: number;
    end_width?: number;
    start_length?: number;
    end_length?: number;
    start_height?: number;
    end_height?: number;
    start_price?: number;
    end_price?: number;
    cost_type: string;
    cost: number;
    percentage_of?: string;
    is_cumulative?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface ColoredScrewCreationAttributes extends Omit<IColoredScrew, "colored_screw_id"> {}

@Table({ tableName: "colored_screw", timestamps: false })
export default class ColoredScrew extends Model<IColoredScrew, ColoredScrewCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare colored_screw_id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare start_width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare end_width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare start_length: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare end_length: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare start_height: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
    declare end_height: number;

    @Column({ type: DataType.FLOAT(10,2), allowNull: false, defaultValue: 0 })
    declare start_price: number;

    @Column({ type: DataType.DOUBLE(10,2), allowNull: false, defaultValue: 0 })
    declare end_price: number;

    @Column({ type: DataType.STRING(10), allowNull: false })
    declare cost_type: string;

    @Column({ type: DataType.FLOAT(10,2), allowNull: false })
    declare cost: number;

    @Column({ type: DataType.STRING(15), allowNull: true, comment: "1 => Total Building Amount 2 => Base Price 3 => Wall Price" })
    declare percentage_of?: string;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare is_cumulative: boolean;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at: Date;
}
