import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IDataOverhang {
    id?: number;
    manufacturer_id: number;
    region_id: number;
    building_id: number;
    row_data: string;
    created_at?: Date;
    updated_at?: Date;
}

interface DataOverhangCreationAttributes extends Omit<IDataOverhang, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "data_overhang", timestamps: false })
export default class DataOverhang extends Model<IDataOverhang, DataOverhangCreationAttributes> {
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

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: () => new Date() })
    declare created_at?: Date;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: () => new Date() })
    declare updated_at?: Date;
}
