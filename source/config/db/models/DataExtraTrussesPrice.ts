import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataExtraTrussesPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    extra_trusses_row?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataExtraTrussesPriceCreationAttributes extends Omit<IDataExtraTrussesPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_extra_trusses_price", timestamps: false })
export default class DataExtraTrussesPrice extends Model<IDataExtraTrussesPrice, DataExtraTrussesPriceCreationAttributes> {
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
    declare extra_trusses_row?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
