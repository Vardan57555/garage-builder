import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

export interface IRoofStyles {
    id?: number;
    manu_1: string;
    manu_2: string;
    manu_3: string;
    manu_4: string;
    manu_5: string;
    manu_6: string;
    manu_7: string;
    manu_8: string;
    manu_9: string;
    manu_10: string;
    manu_11: string;
    manu_12: string;
    manu_13?: string | null;
    manu_14?: string | null;
    manu_15?: string | null;
    manu_16?: string | null;
    manu_17?: string | null;
}

interface RoofStylesCreationAttributes extends Omit<IRoofStyles, "id"> {}

@Table({ tableName: "roof_styles", timestamps: false })
export default class RoofStyles extends Model<IRoofStyles, RoofStylesCreationAttributes> {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_1: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_2: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_3: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_4: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_5: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_6: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_7: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_8: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_9: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_10: string;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare manu_11: string;

    @Column({ type: DataType.STRING(150), allowNull: false })
    declare manu_12: string;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_13?: string | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_14?: string | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_15?: string | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_16?: string | null;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare manu_17?: string | null;
}
