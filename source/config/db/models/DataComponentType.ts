import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataComponentType {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    component_type_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataComponentTypeCreationAttributes extends Omit<IDataComponentType, "id"> {}

@Table({ tableName: "data_component_type", timestamps: false })
export default class DataComponentType extends Model<IDataComponentType, DataComponentTypeCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare manufacturer_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare region_id?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare building_id?: number;

    @Column({ type: DataType.BLOB, allowNull: true })
    declare component_type_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
