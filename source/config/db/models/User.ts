import { Table, Column, Model, DataType, PrimaryKey, Default } from "sequelize-typescript";

export interface IUser {
    id: number;
    name: string;
    email: string;
    password: string;
    remember_token?: string | null;
    created_at?: Date | null;
    updated_at?: Date | null;
    is_admin?: number;
    manufacturer_ids?: string | null;
}

interface UserCreationAttributes extends Omit<IUser, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "users", timestamps: false })
export default class User extends Model<IUser, UserCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(191), allowNull: false  })
    declare name: string;

    @Column({ type: DataType.STRING(191), allowNull: false })
    declare email: string;

    @Column({ type: DataType.STRING(191), allowNull: false  })
    declare password: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare remember_token?: string | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare created_at?: Date | null;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at?: Date | null;

    @Default(0)
    @Column({ type: DataType.TINYINT, allowNull: true })
    declare is_admin?: number;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare manufacturer_ids?: string | null;
}
