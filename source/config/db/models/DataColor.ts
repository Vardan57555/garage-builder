import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataColor {
    id?: number;
    name?: string;
    red_value?: number;
    green_value?: number;
    blue_value?: number;
    hex_value?: string;
}

interface DataColorCreationAttributes extends Omit<IDataColor, "id"> {}

@Table({ tableName: "data_colors", timestamps: false })
export default class DataColor extends Model<IDataColor, DataColorCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(25), allowNull: true })
    declare name?: string;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare red_value?: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare green_value?: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare blue_value?: number;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare hex_value?: string;
}
