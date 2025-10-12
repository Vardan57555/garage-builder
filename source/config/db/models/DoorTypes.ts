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

export interface IDoorTypes {
    id?: number;
    type: string;
    name: string;
    slug: string;
    category?: string | null;
    created_at?: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

interface DoorTypesCreationAttributes extends Omit<IDoorTypes, "id" | "created_at" | "updated_at" | "deleted_at"> {}

@Table({tableName: "door_types", timestamps: true, paranoid: true})
export default class DoorTypes extends Model<IDoorTypes, DoorTypesCreationAttributes>
{
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare type: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(128), allowNull: false })
    declare slug: string;

    @Column({ type: DataType.STRING(1000), allowNull: true })
    declare category?: string | null;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date | null;

    @DeletedAt
    @Column({ type: DataType.DATE, allowNull: true })
    declare deleted_at?: Date | null;
}
