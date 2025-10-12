import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    Default,
    CreatedAt,
} from "sequelize-typescript";

export interface IFourFeetCenter {
    id?: number;
    map_id: number;
    sheet_name?: string | null;
    sheet_type?: "end" | "side" | "both_end" | "both_side" | "height_width" | "height_length" | null;
    width: number;
    length: number;
    cost: number;
    cost_type: "$" | "%" | "sqft" | "ft";
    price_of_add_ons?: string | null;
    created_at?: Date;
}

interface FourFeetCenterCreationAttributes extends Omit<IFourFeetCenter, "id" | "created_at"> {}

@Table({ tableName: "four_feet_center", timestamps: false })
export default class FourFeetCenter extends Model<IFourFeetCenter, FourFeetCenterCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare sheet_name?: string | null;

    @Column({ type: DataType.ENUM('end','side','both_end','both_side','height_width','height_length'), allowNull: true })
    declare sheet_type?: "end" | "side" | "both_end" | "both_side" | "height_width" | "height_length" | null;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Default('$')
    @Column({ type: DataType.ENUM('$','%','sqft','ft'), allowNull: false })
    declare cost_type: "$" | "%" | "sqft" | "ft";

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare price_of_add_ons?: string | null;

    @CreatedAt
    @Default(DataType.NOW)
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at?: Date;
}
