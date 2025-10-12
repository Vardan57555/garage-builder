import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

export interface IDrawingOptions {
    id?: number;
    name: string;
    ordering: number;
}

interface DrawingOptionsCreationAttributes extends Omit<IDrawingOptions, "id"> {}

@Table({ tableName: "drawing_options", timestamps: false })
export default class DrawingOptions extends Model<IDrawingOptions, DrawingOptionsCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare name: string;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
    declare ordering: number;
}
