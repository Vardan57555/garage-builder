import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface ICrossBracing {
    id?: number;
    map_id: number;
    sheet_name: string;
    sheet_label: string;
    is_default: 'included' | 'no' | 'yes';
    height: number;
    length: number;
    cost: number;
}

interface CrossBracingCreationAttributes extends Omit<ICrossBracing, "id"> {}

@Table({ tableName: "cross_bracings", timestamps: false })
export default class CrossBracing extends Model<ICrossBracing, CrossBracingCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'diagonal_braces' })
    declare sheet_name: string;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'Diagonal Braces' })
    declare sheet_label: string;

    @Column({
        type: DataType.ENUM('included', 'no', 'yes'),
        allowNull: false,
        defaultValue: 'no'
    })
    declare is_default: 'included' | 'no' | 'yes';

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;
}
