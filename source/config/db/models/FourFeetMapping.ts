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

export interface IFourFeetMapping {
    id?: number;
    map_id: number;
    certificate_id: number;
    gauge: "0" | "12" | "14";
    doc: "4" | "5";
    siding_material?: string | null;
    is_4_feet_cost: "no" | "yes" | "included" | "include_with_price";
    is_bow_cost: "no" | "yes" | "included" | "include_with_price";
    min_width: number;
    max_width: number;
    min_height: number;
    max_height: number;
    roof_pitch?: string | null;
    created_at?: Date;
}

interface FourFeetMappingCreationAttributes extends Omit<IFourFeetMapping, "id" | "created_at"> {}

@Table({ tableName: "four_feet_mapping", timestamps: false })
export default class FourFeetMapping extends Model<IFourFeetMapping, FourFeetMappingCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare certificate_id: number;

    @Default("0")
    @Column({ type: DataType.ENUM("0","12","14"), allowNull: false })
    declare gauge: "0" | "12" | "14";

    @Default("4")
    @Column({ type: DataType.ENUM("4","5"), allowNull: false })
    declare doc: "4" | "5";

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare siding_material?: string | null;

    @Column({ type: DataType.ENUM("no","yes","included","include_with_price"), allowNull: false })
    declare is_4_feet_cost: "no" | "yes" | "included" | "include_with_price";

    @Column({ type: DataType.ENUM("no","yes","included","include_with_price"), allowNull: false })
    declare is_bow_cost: "no" | "yes" | "included" | "include_with_price";

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare min_width: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare max_width: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare min_height: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare max_height: number;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare roof_pitch?: string | null;

    @CreatedAt
    @Default(DataType.NOW)
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at?: Date;
}
