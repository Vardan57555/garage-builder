import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IWindowsOld {
    id: number;
    map_id: number;
    width: number;
    height: number;
    cost: number;
    on_side_cost?: number;
    vertical_side_cost: number;
    frameout_cost_side?: number;
    frameout_cost_end?: number;
    type?: number;
    door_type: string;
    door_category?: string | null;
    is_default?: string | null;
}

interface WindowsOldCreationAttributes extends Omit<IWindowsOld, "id"> {}

@Table({ tableName: "windows_old", timestamps: false })
export default class WindowsOld extends Model<IWindowsOld, WindowsOldCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare height: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare on_side_cost?: number;

    @Default(0)
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical_side_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare frameout_cost_side?: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare frameout_cost_end?: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: true })
    declare type?: number;

    @Default('standard_windows')
    @Column({ type: DataType.STRING(128), allowNull: false })
    declare door_type: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare door_category?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare is_default?: string | null;
}
