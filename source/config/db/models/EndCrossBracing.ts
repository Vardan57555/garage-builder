import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IEndCrossBracing {
    id?: number;
    map_id: number;
    sheet_name?: string;
    sheet_label?: string;
    is_default?: "included" | "no" | "yes";
    height: number;
    width: number;
    cost: number;
}

interface EndCrossBracingCreationAttributes extends Omit<IEndCrossBracing, "id"> {}

@Table({ tableName: "end_cross_bracings", timestamps: false })
export default class EndCrossBracing extends Model<IEndCrossBracing, EndCrossBracingCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "diagonal_braces" })
    declare sheet_name?: string;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "Diagonal Braces" })
    declare sheet_label?: string;

    @Column({ type: DataType.ENUM("included", "no", "yes"), allowNull: true, defaultValue: "no" })
    declare is_default?: "included" | "no" | "yes";

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare width: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;
}
