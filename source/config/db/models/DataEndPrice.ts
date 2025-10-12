import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataEndPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_width?: number;
    max_width?: number;
    min_height?: number;
    max_height?: number;
    distance_on_width?: number;
    gauge_prices_12: number;
    other_leg: boolean;
    each_end_structure_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataEndPriceCreationAttributes extends Omit<IDataEndPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_end_price", timestamps: false })
export default class DataEndPrice extends Model<IDataEndPrice, DataEndPriceCreationAttributes> {
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

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare min_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare max_height?: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare distance_on_width?: number;

    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 0 })
    declare gauge_prices_12: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare other_leg: boolean;

    @Column({ type: DataType.BLOB("medium"), allowNull: true })
    declare each_end_structure_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
