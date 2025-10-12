import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface ICustomSizeStatus {
    id?: number;
    map_id: number;
    row_data: string;
    clearance_data?: string;
}

interface CustomSizeStatusCreationAttributes extends Omit<ICustomSizeStatus, "id"> {}

@Table({ tableName: "custom_size_status", timestamps: false })
export default class CustomSizeStatus extends Model<ICustomSizeStatus, CustomSizeStatusCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.STRING(1000), allowNull: false })
    declare row_data: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare clearance_data?: string;
}
