import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
} from "sequelize-typescript";

export interface IGarageDoorAddons {
    id?: number;
    name: string;
    slug: string;
    category?: string | null;
    created_at?: Date | null;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface GarageDoorAddonsCreationAttributes extends Omit<IGarageDoorAddons, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "garage_door_addons", timestamps: true, paranoid: true, createdAt: "created_at", updatedAt: "updated_at", deletedAt: "deleted_at" })
export default class GarageDoorAddons extends Model<IGarageDoorAddons, GarageDoorAddonsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare slug: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare category?: string | null;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date | null;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date | null;

    @DeletedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date | null;
}
