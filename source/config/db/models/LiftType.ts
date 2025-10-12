import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface ILiftType {
    id: number;
    name: string;
}

interface LiftTypeCreationAttributes extends Omit<ILiftType, "id"> {}

@Table({ tableName: "lift_types", timestamps: false })
export default class LiftType extends Model<ILiftType, LiftTypeCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;
}
