import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface ITrussUpgrades {
    id: number;
    map_id: number;
    truss: number;
    width: number;
    length: number;
    cost: number;
    height: number;
}

interface TrussUpgradesCreationAttributes extends Omit<ITrussUpgrades, "id"> {}

@Table({ tableName: "truss_upgrades", timestamps: false })
export default class TrussUpgrades extends Model<ITrussUpgrades, TrussUpgradesCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare truss: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare width: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Default(0)
    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare height: number;
}
