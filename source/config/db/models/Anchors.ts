import { Column, DataType,  Model, PrimaryKey, Table } from "sequelize-typescript";

export interface IAnchor {
    id?: number;
    name: string;
    created_at?: number;
    updated_at?: number;
}

interface AnchorCreationAttributes extends Omit<IAnchor, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "anchors", timestamps: false })
export default class Anchor extends Model<IAnchor, AnchorCreationAttributes> {

    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: () => Date.now() })
    declare created_at: number;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: () => Date.now() })
    declare updated_at: number;
}
