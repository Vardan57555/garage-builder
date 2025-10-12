import { Service } from "@common/service/Service";
import {IById} from "@common/io/ICustomService";
import {IState} from "@modules/states-service/services/io/IState";

export interface StateService extends Service
{
    fetchAll(): Promise<IState | IState[]>

    fetchByManufacturerId(body: Partial<IById>): Promise<IState | IState[]>
}
