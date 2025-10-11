import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
} from "sequelize-typescript";

export interface INote {
    id: number;
    manufacturer_id: number;
    region_id: number;
    building_id: number;
    user_id: number;
    title: string;
    note: string;
    module: string;
    created_at?: Date | null;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface NoteCreationAttributes extends Omit<INote, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({ tableName: "notes", timestamps: true, paranoid: true, createdAt: "created_at", updatedAt: "updated_at", deletedAt: "deleted_at" })
export default class Note extends Model<INote, NoteCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare manufacturer_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare region_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare building_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare user_id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare title: string;

    @Column({ type: DataType.STRING(500), allowNull: false })
    declare note: string;

    @Column({ type: DataType.STRING(50), allowNull: false })
    declare module: string;

    @CreatedAt
    @Column({ type: DataType.DATE })
    declare created_at?: Date | null;

    @UpdatedAt
    @Column({ type: DataType.DATE })
    declare updated_at?: Date | null;

    @DeletedAt
    @Column({ type: DataType.DATE })
    declare deleted_at?: Date | null;
}
