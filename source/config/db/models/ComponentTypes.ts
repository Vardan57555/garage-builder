import { Column, DataType, Model, PrimaryKey, AutoIncrement, Table } from "sequelize-typescript";

export interface IComponentType {
    id?: number;
    map_id?: number;
    type_name?: string;
    component_type_id?: number;
}

interface ComponentTypeCreationAttributes extends Omit<IComponentType, "id"> {}

@Table({ tableName: "component_types", timestamps: false })
export default class ComponentType extends Model<IComponentType, ComponentTypeCreationAttributes> {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare map_id: number;

    @Column({ type: DataType.STRING(150), allowNull: true })
    declare type_name: string;

    @Column({ type: DataType.TINYINT, allowNull: true, comment: 'Garage Door - 1, Garage Door Frameout - 2, Walkin Door - 3, Window - 4' })
    declare component_type_id: number;
}
