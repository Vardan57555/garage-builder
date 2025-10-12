import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IWrapAroundConnection {
    id: number;
    map_id: number;
    width: number;
    height: number;
    cost: number;
}

interface WrapAroundConnectionCreationAttributes extends Omit<IWrapAroundConnection, "id"> {}

@Table({ tableName: "wrap_around_connection", timestamps: false })
export default class WrapAroundConnection extends Model<IWrapAroundConnection, WrapAroundConnectionCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare height: number;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;
}
