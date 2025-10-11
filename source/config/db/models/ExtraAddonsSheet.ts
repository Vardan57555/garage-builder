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

export interface IExtraAddonsSheet {
    id?: number;
    name: string;
    slug: string;
    created_at?: Date | null;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface ExtraAddonsSheetCreationAttributes extends Omit<IExtraAddonsSheet, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({
    tableName: "extra_addons_sheets",
    timestamps: true,
    paranoid: true, // enables soft delete
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
})
export default class ExtraAddonsSheet extends Model<IExtraAddonsSheet, ExtraAddonsSheetCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare slug: string;

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
