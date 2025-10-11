import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table, Default } from "sequelize-typescript";

export interface IDataDrawings {
    id?: number;
    manufacturer_id: number;
    region_id: number;
    building_id: number;
    row_data: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataDrawingsCreationAttributes extends Omit<IDataDrawings, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_drawings", timestamps: false })
export default class DataDrawings extends Model<IDataDrawings, DataDrawingsCreationAttributes> {
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

    @Default(() => new Date())
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at: Date;

    @Default(() => new Date())
    @Column({ type: DataType.DATE, allowNull: false })
    declare updated_at: Date;
}
