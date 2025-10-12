import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IState {
    id: number;
    name: string;
    code: string;
    region_id: number;
}

interface StateCreationAttributes extends Omit<IState, "id"> {}

@Table({ tableName: "states", timestamps: false })
export default class State extends Model<IState, StateCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(30), allowNull: false })
    declare name: string;

    @Column({ type: DataType.CHAR(2), allowNull: false })
    declare code: string;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare region_id: number;
}
