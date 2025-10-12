import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IExtraPanels {
    id?: number;
    map_id: number;
    price_type: "$" | "%" | "sqft" | "ft";
    price_of?: string | null;
    length: number;
    name: string;
    label?: string | null;
    cost: number;
    cut_panel_cost: number;
    vertical_panel_cost: number;
    horizontal_roof_panel_cost: number;
    vertical_roof_panel_cost: number;
    panel_jtrim: number;
    is_panel_jtrim: "yes" | "no" | "included";
    cut_panel_jtrim: number;
    is_cut_panel_jtrim: "yes" | "no" | "included";
}

interface ExtraPanelsCreationAttributes extends Omit<IExtraPanels, "id"> {}

@Table({ tableName: "extra_panels", timestamps: false })
export default class ExtraPanels extends Model<IExtraPanels, ExtraPanelsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.ENUM("$", "%", "sqft", "ft"), allowNull: false, defaultValue: "$" })
    declare price_type: "$" | "%" | "sqft" | "ft";

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare price_of?: string | null;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "metal" })
    declare name: string;

    @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: "Metal" })
    declare label?: string | null;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare cut_panel_cost: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare vertical_panel_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare horizontal_roof_panel_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare vertical_roof_panel_cost: number;

    @Column({ type: DataType.FLOAT, allowNull: false })
    declare panel_jtrim: number;

    @Column({ type: DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" })
    declare is_panel_jtrim: "yes" | "no" | "included";

    @Column({ type: DataType.FLOAT, allowNull: false })
    declare cut_panel_jtrim: number;

    @Column({ type: DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" })
    declare is_cut_panel_jtrim: "yes" | "no" | "included";
}
