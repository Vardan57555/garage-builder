import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

export interface IJTrim {
    id: number;
    length: number;
    cost: number;
    map_id: number;
}

interface JTrimCreationAttributes extends Omit<IJTrim, "id"> {}

@Table({ tableName: "jtrims", timestamps: false })
export default class JTrim extends Model<IJTrim, JTrimCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare id: number;

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    declare length: number;

    @Column({ type: DataType.FLOAT.UNSIGNED, allowNull: false })
    declare cost: number;

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare map_id: number;
}
