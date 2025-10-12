import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface ISidingMaterials {
    id: number;
    name: string;
    slug: string;
    category?: string;
    created_at: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface SidingMaterialsCreationAttributes extends Omit<ISidingMaterials, "id" | "created_at"> {}

@Table({ tableName: "siding_materials", timestamps: false })
export default class SidingMaterials extends Model<ISidingMaterials, SidingMaterialsCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare slug: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare category?: string;

    @Default(DataType.NOW)
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date | null;
}
