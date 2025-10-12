import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IEachEndClose {
    id?: number;
    map_id: number;
    price_type?: "$" | "%" | "sqft" | "ft";
    price_of?: string | null;
    label?: string;
    name: string;
    width: number;
    height: number;
    end_close_cost: number;
    certified_end_cost: number;
    vertical_ends_cost: number;
    end_close_cost_12: number;
    vertical_ends_cost_12: number;
    end_close_cost_other: number;
    vertical_ends_cost_other: number;
    end_close_cost_12_other: number;
    vertical_ends_cost_12_other: number;
}

interface EachEndCloseCreationAttributes extends Omit<IEachEndClose, "id"> {}

@Table({ tableName: "each_end_close", timestamps: false })
export default class EachEndClose extends Model<IEachEndClose, EachEndCloseCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.ENUM("$","%","sqft","ft"), allowNull: false, defaultValue: "$" })
    declare price_type?: "$" | "%" | "sqft" | "ft";

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare price_of?: string | null;

    @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: "Metal" })
    declare label?: string;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "metal" })
    declare name: string;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare end_close_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare certified_end_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare vertical_ends_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare end_close_cost_12: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_ends_cost_12: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare end_close_cost_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_ends_cost_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare end_close_cost_12_other: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_ends_cost_12_other: number;
}
