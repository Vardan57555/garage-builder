import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface ITrussName {
    id: number;
    map_id?: number | null;
    name?: string | null;
    label?: string | null;
    min_width?: number | null;
    max_width?: number | null;
    min_height: number;
    max_height: number;
    is_default: number;
    is_show: number;
    cost: number;
    price_type: '$' | '%' | 'sqft' | 'ft';
    price_of?: string | null;
}

interface TrussNameCreationAttributes extends Omit<ITrussName, "id"> {}

@Table({ tableName: "truss_name", timestamps: false })
export default class TrussName extends Model<ITrussName, TrussNameCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare map_id?: number | null;

    @Column({ type: DataType.STRING(150), allowNull: true  })
    declare name?: string | null;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare label?: string | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_width?: number | null;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_width?: number | null;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare min_height: number;

    @Default(0)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare max_height: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare is_default: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare is_show: number;

    @Default(0.0)
    @Column({ type: DataType.FLOAT(8, 2), allowNull: false })
    declare cost: number;

    @Default('$')
    @Column({ type: DataType.ENUM('$','%','sqft','ft'), allowNull: false })
    declare price_type: '$' | '%' | 'sqft' | 'ft';

    @Column({ type: DataType.STRING(250), allowNull: true })
    declare price_of?: string | null;
}
