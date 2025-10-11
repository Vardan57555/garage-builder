import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IInsulationCost {
    id?: number;
    map_id: number;
    insulation_id: number;
    cost: number;
}

interface InsulationCostCreationAttributes extends Omit<IInsulationCost, "id"> {}

@Table({ tableName: "insulation_costs", timestamps: false })
export default class InsulationCost extends Model<IInsulationCost, InsulationCostCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare insulation_id: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;
}
