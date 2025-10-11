import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IExtraAddOn {
    id?: number;
    map_id: number;
    sheet_name: string;
    sheet_label?: string | null;
    sheet_type: string;
    height: number;
    width: number;
    length: number;
    start_width: number;
    end_width: number;
    start_length: number;
    end_length: number;
    start_height: number;
    end_height: number;
    start_price: number;
    end_price: number;
    cost: number;
    cost_type: "$" | "%" | "sqft" | "ft";
    price_of?: string | null;
    is_taxable: boolean;
    is_checkbox?: boolean;
    is_cumulative: boolean;
    is_always_checked: boolean;
    distance_on_center?: number;
}

interface ExtraAddOnCreationAttributes extends Omit<IExtraAddOn, "id"> {}

@Table({ tableName: "extra_add_on", timestamps: false })
export default class ExtraAddOn extends Model<IExtraAddOn, ExtraAddOnCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare map_id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare sheet_name: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare sheet_label?: string | null;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare sheet_type: string;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare height: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare width: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare length: number;

    @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 0 })
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

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare start_price: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare end_price: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.ENUM("$", "%", "sqft", "ft"), allowNull: false })
    declare cost_type: "$" | "%" | "sqft" | "ft";

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare price_of?: string | null;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare is_taxable: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
    declare is_checkbox?: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_cumulative: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_always_checked: boolean;

    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
    declare distance_on_center?: number;
}
