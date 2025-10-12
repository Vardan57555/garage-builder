import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataInstallationFeesPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    installation_fees_data?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataInstallationFeesPriceCreationAttributes extends Omit<IDataInstallationFeesPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_installation_fees_price", timestamps: false })
export default class DataInstallationFeesPrice extends Model<IDataInstallationFeesPrice, DataInstallationFeesPriceCreationAttributes> {
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
    declare installation_fees_data?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
