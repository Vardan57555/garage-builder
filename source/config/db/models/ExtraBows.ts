import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IExtraBows {
    id?: number;
    map_id: number;
    width: number;
    height: number;
    cost: number;
    single_leg: number;
    double_leg: number;
    ladder_leg: number;
}

interface ExtraBowsCreationAttributes extends Omit<IExtraBows, "id"> {}

@Table({ tableName: "extra_bows", timestamps: false })
export default class ExtraBows extends Model<IExtraBows, ExtraBowsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
    declare cost: number;

    @Column({ type: DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 })
    declare single_leg: number;

    @Column({ type: DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 })
    declare double_leg: number;

    @Column({ type: DataType.FLOAT(10, 2), allowNull: false, defaultValue: 0.0 })
    declare ladder_leg: number;
}
