import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataBowsPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    min_width?: number;
    max_width?: number;
    min_height?: number;
    max_height?: number;
    distance_on_width?: number;
    bows_row?: Buffer;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataBowsPriceCreationAttributes extends Omit<IDataBowsPrice, "id"> {}

@Table({ tableName: "data_bows_price", timestamps: false })
export default class DataBowsPrice extends Model<IDataBowsPrice, DataBowsPriceCreationAttributes> {
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

    @Column({ type: DataType.BLOB, allowNull: true })
    declare bows_row?: Buffer;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
