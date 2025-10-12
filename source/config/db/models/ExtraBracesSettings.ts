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

export interface IExtraBracesSettings {
    id?: number;
    name: string;
    slug: string;
    labels?: string | null;
    is_default: boolean;
    created_at?: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface ExtraBracesSettingsCreationAttributes extends Omit<IExtraBracesSettings, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({
    tableName: "extra_braces_settings",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
})
export default class ExtraBracesSettings extends Model<IExtraBracesSettings, ExtraBracesSettingsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare slug: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare labels?: string | null;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare is_default: boolean;

    @CreatedAt
    @Column({ type: DataType.DATE })
    declare created_at: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE })
    declare updated_at?: Date | null;

    @DeletedAt
    @Column({ type: DataType.DATE })
    declare deleted_at?: Date | null;
}
