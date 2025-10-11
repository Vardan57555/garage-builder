import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataExtraAddOn {
    id?: number;
    manufacturer_id: number;
    region_id: number;
    building_id: number;
    row_data: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataExtraAddOnCreationAttributes extends Omit<IDataExtraAddOn, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_extra_add_on", timestamps: false })
export default class DataExtraAddOn extends Model<IDataExtraAddOn, DataExtraAddOnCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare region_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare building_id: number;

    @Column({ type: DataType.TEXT("long"), allowNull: false })
    declare row_data: string;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    declare updated_at: Date;
}
