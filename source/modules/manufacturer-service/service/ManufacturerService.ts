import { Service } from "@common/service/Service";
import { IManufacturer } from "@modules/manufacturer-service/service/io/IManufacturer";
import {IById} from "@common/io/ICustomService";

export interface ManufacturerService extends Service
{
    fetchAll(): Promise<IManufacturer | IManufacturer[]>

    fetchManufacturerByState(body: Partial<IById>): Promise<IManufacturer | IManufacturer[]>;
}
