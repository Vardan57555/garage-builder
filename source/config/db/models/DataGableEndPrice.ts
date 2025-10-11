import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataGableEndPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_width?: number;
    max_width?: number;
    gable_end_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataGableEndPriceCreationAttributes extends Omit<IDataGableEndPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_gable_end_price", timestamps: false })
export default class DataGableEndPrice extends Model<IDataGableEndPrice, DataGableEndPriceCreationAttributes> {
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

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_width?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_width?: number;

    @Column({ type: DataType.BLOB, allowNull: true })
    declare gable_end_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
