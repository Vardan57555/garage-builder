import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IOverhang {
    id: number;
    map_id: number;
    sheet_name?: string | null;
    sheet_type?: "end" | "side" | "both_end" | "both_side" | null;
    width: number;
    length: number;
    cost: number;
    cost_type: "$" | "%" | "sqft";
    price_of?: string | null;
}

interface OverhangCreationAttributes extends Omit<IOverhang, "id"> {}

@Table({ tableName: "overhang", timestamps: false })
export default class Overhang extends Model<IOverhang, OverhangCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare sheet_name?: string | null;

    @Column({ type: DataType.ENUM("end","side","both_end","both_side"), allowNull: true })
    declare sheet_type?: "end" | "side" | "both_end" | "both_side" | null;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.ENUM("$","%","sqft"), allowNull: false, defaultValue: "$" })
    declare cost_type: "$" | "%" | "sqft";

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare price_of?: string | null;
}
