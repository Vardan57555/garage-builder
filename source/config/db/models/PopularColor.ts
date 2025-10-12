import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IPopularColor {
    id?: number;
    sheet_name?: string | null;
    sheet_label?: string | null;
    manufacturer_id: number;
    roof_hex_value?: string | null;
    trim_hex_value?: string | null;
    wall_hex_value?: string | null;
}

interface PopularColorCreationAttributes
    extends Omit<IPopularColor, "id"> {}

@Table({ tableName: "popular_colors", timestamps: false })
export default class PopularColor extends Model<
    IPopularColor,
    PopularColorCreationAttributes
> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: true, defaultValue: "metal" })
    declare sheet_name?: string | null;

    @Column({ type: DataType.STRING(255), allowNull: true, defaultValue: "Metal" })
    declare sheet_label?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare roof_hex_value?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare trim_hex_value?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare wall_hex_value?: string | null;
}
