import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IMigration {
    id: number;
    migration: string;
    batch: number;
}

interface MigrationCreationAttributes extends Omit<IMigration, "id"> {}

@Table({ tableName: "migrations", timestamps: false })
export default class Migration extends Model<IMigration, MigrationCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(191), allowNull: false })
    declare migration: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare batch: number;
}
