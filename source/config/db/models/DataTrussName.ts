import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataTrussName {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    trussname_row?: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataTrussNameCreationAttributes extends Omit<IDataTrussName, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_truss_name", timestamps: false })
export default class DataTrussName extends Model<IDataTrussName, DataTrussNameCreationAttributes> {
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

    @Column({ type: DataType.TEXT("long"), allowNull: true })
    declare trussname_row?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;
}
