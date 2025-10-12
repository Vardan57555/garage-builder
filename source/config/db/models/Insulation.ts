import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IInsulation {
    id?: number;
    name?: string | null;
}

interface InsulationCreationAttributes extends Omit<IInsulation, "id"> {}

@Table({ tableName: "insulations", timestamps: false })
export default class Insulation extends Model<IInsulation, InsulationCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(200), allowNull: true })
    declare name?: string | null;
}
