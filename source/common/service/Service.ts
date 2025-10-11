import { IPaginatedResult } from "@utils/pagination/app/io/IPagination";
import { FindOptions } from "sequelize";
import { IDeleteBody } from "../io/ICustomService";

export interface Service
{
    create(body: {}): Promise<{}>;

    update(body: {}): Promise<{}>;

    delete(params: {}): Promise<IDeleteBody>;

    fetchAll(params: {}, options?: FindOptions): Promise<IPaginatedResult<{}>>;

    fetchById(params: {}, options?: FindOptions): Promise<{}>;

    validateOutput(params: {} | {}[]): {} | {}[];
}
