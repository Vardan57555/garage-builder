import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

export interface ISideEndDetails {
    id: number;
    map_id: number;
    settings?: string;
}

interface SideEndDetailsCreationAttributes extends Omit<ISideEndDetails, "id"> {}

@Table({ tableName: "side_end_details", timestamps: false })
export default class SideEndDetails extends Model<ISideEndDetails, SideEndDetailsCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare settings: string;
}
