import { Column, DataType, Default, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IColorImage {
    id?: number;
    image_name: string;
    created_at: Date;
    updated_at: Date | null;
}

interface ColorImageCreationAttributes extends Omit<IColorImage, "id" | "created_at" | "updated_at"> {}

@Table({ tableName: "color_images", timestamps: false })
export default class ColorImage extends Model<IColorImage, ColorImageCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Default("null")
    @Column({ type: DataType.STRING, allowNull: false })
    declare image_name: string;

    @Default(() => new Date())
    @Column({ type: DataType.DATE, allowNull: false })
    declare created_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare updated_at: Date | null;
}
