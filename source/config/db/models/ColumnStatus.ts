import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";
import { Module } from "@common/io/enum/Module";

export interface IColumnStatus {
    id?: number;
    map_id: number;
    module: Module;
    column_name: string;
    status: boolean;
}

interface ColumnStatusCreationAttributes extends Omit<IColumnStatus, "id"> {}

@Table({ tableName: "column_status", timestamps: false })
export default class ColumnStatus extends Model<IColumnStatus, ColumnStatusCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.ENUM('length_add_on','width_add_on'), allowNull: false })
    declare module: Module;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare column_name: string;

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    declare status: boolean;
}
