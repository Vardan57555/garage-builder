import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IDrawings {
    id?: number;
    map_id: number;
    name: string;
    cost_type: "$" | "%";
    cost: number;
    is_cost?: boolean;
    is_default: "yes" | "no";
}

interface DrawingsCreationAttributes extends Omit<IDrawings, "id"> {}

@Table({ tableName: "drawings", timestamps: false })
export default class Drawings extends Model<IDrawings, DrawingsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;

    @Column({ type: DataType.ENUM("$", "%"), allowNull: false, defaultValue: "$" })
    declare cost_type: "$" | "%";

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
    declare is_cost?: boolean;

    @Column({ type: DataType.ENUM("yes", "no"), allowNull: false, defaultValue: "no" })
    declare is_default: "yes" | "no";
}
