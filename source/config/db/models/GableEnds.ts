import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IGableEnds {
    id?: number;
    map_id: number;
    price_type: "$" | "%" | "sqft" | "ft";
    price_of?: string | null;
    width: number;
    name: string;
    label?: string | null;
    uncertified: number;
    certified: number;
    vertical: number;
    extended: number;
    vertical_extended: number;
    vertical_certified: number;
    jtrim: number;
    is_jtrim: "yes" | "no" | "included";
}

interface GableEndsCreationAttributes extends Omit<IGableEnds, "id"> {}

@Table({ tableName: "gable_ends", timestamps: false })
export default class GableEnds extends Model<IGableEnds, GableEndsCreationAttributes> {
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
    declare width: number;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "metal" })
    declare name: string;

    @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: "Metal" })
    declare label?: string | null;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare uncertified: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare certified: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare extended: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical_extended: number;

    @Column({ type: DataType.FLOAT, allowNull: false })
    declare vertical_certified: number;

    @Column({ type: DataType.FLOAT, allowNull: false })
    declare jtrim: number;

    @Column({ type: DataType.ENUM("yes", "no", "included"), allowNull: false, defaultValue: "no" })
    declare is_jtrim: "yes" | "no" | "included";
}
