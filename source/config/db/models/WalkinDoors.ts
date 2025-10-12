import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IWalkinDoors {
    id: number;
    map_id: number;
    is_custom_size: number;
    width: number;
    height: number;
    width_range?: string | null;
    height_range?: string | null;
    cost: number;
    vertical_side_cost: number;
    on_side_cost?: number;
    frameout_cost_side?: number;
    frameout_cost_end?: number;
    door_type: string;
    door_category?: string | null;
    is_default?: string | null;
    type?: 'framout' | 'frameout' | 'walkin' | 'custom_walkin' | 'custom_frameout' | null;
}

interface WalkinDoorsCreationAttributes extends Omit<IWalkinDoors, "id"> {}

@Table({ tableName: "walkin_doors", timestamps: false })
export default class WalkinDoors extends Model<IWalkinDoors, WalkinDoorsCreationAttributes> {
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
    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare vertical_side_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare on_side_cost?: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare frameout_cost_side?: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: true })
    declare frameout_cost_end?: number;

    @Default('standard_walk_in_doors')
    @Column({ type: DataType.STRING(128), allowNull: false })
    declare door_type: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare door_category?: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare is_default?: string | null;

    @Column({
        type: DataType.ENUM('framout','frameout','walkin','custom_walkin','custom_frameout'),
        allowNull: true
    })
    declare type?: 'framout' | 'frameout' | 'walkin' | 'custom_walkin' | 'custom_frameout' | null;
}
