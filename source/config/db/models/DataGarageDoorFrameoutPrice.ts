import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataGarageDoorFrameoutPrice {
    id?: number;
    manufacturer_id?: number;
    region_id?: number;
    building_id?: number;
    garage_door_frameout_row?: Buffer;
    custom_frameout_row?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface DataGarageDoorFrameoutPriceCreationAttributes extends Omit<IDataGarageDoorFrameoutPrice, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "data_garage_door_frameout_price", timestamps: false })
export default class DataGarageDoorFrameoutPrice extends Model<IDataGarageDoorFrameoutPrice, DataGarageDoorFrameoutPriceCreationAttributes> {
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
    declare garage_door_frameout_row?: Buffer;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare custom_frameout_row?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date;
}
