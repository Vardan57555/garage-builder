import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IStatesBk {
    id: number;
    name: string;
    region_id: number;
}

interface StatesBkCreationAttributes extends Omit<IStatesBk, "id"> {}

@Table({ tableName: "states_bk", timestamps: false })
export default class StatesBk extends Model<IStatesBk, StatesBkCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(30), allowNull: false })
    declare name: string;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare region_id: number;
}
