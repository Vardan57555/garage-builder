import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IWindows {
    id: number;
    map_id: number;
    is_custom_size: number;
    width: number;
    height: number;
    width_range?: string | null;
    height_range?: string | null;
    cost: number;
    on_side_cost?: number;
    vertical_side_cost: number;
    frameout_cost_side?: number;
    frameout_cost_end?: number;
    door_type: string;
    door_category?: string | null;
    is_default?: string | null;
    type?: 'window' | 'framout' | 'frameout' | 'custom_window' | 'custom_frameout' | null;
}

interface WindowsCreationAttributes extends Omit<IWindows, "id"> {}

@Table({ tableName: "windows", timestamps: false })
export default class Windows extends Model<IWindows, WindowsCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: false })
    declare is_custom_size: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare width: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare height: number;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare width_range?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare height_range?: string | null;

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

    @Default('standard_windows')
    @Column({ type: DataType.STRING(128), allowNull: false })
    declare door_type: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare door_category?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare is_default?: string | null;

    @Column({
        type: DataType.ENUM('window','framout','frameout','custom_window','custom_frameout'),
        allowNull: true
    })
    declare type?: 'window' | 'framout' | 'frameout' | 'custom_window' | 'custom_frameout' | null;
}
