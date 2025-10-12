import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IAddon {
    id?: number;
    map_id: number;
    length: number;
    fourth_center_cost: string;
    risk_cost: number;
    cert_pac_cost: number;
    ground_certificate: number;
    overhang: number;
    jtrim: number;
    interior_anchor: number;
    baserail_caulk: number;
    cut_leg_on_site_cost: number;
    created_at?: number;
    updated_at?: number;
}

interface AddonCreationAttributes extends Omit<IAddon, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "addons", timestamps: false })
export default class Addon extends Model<IAddon, AddonCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;

    @Column({ type: DataType.SMALLINT, allowNull: false })
    declare length: number;

    @Default('0')
    @Column({ type: DataType.STRING(100), allowNull: false })
    declare fourth_center_cost: string;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare risk_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare cert_pac_cost: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare ground_certificate: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare overhang: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare jtrim: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare interior_anchor: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare baserail_caulk: number;

    @Default(0)
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare cut_leg_on_site_cost: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare created_at: number;

    @Default(() => Date.now())
    @Column({ type: DataType.BIGINT, allowNull: false })
    declare updated_at: number;
}
