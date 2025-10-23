import {InstantiationError} from "@errors/InstantiationError";
import {ServerError} from "@errors/ServerError";
import {ValidationTypes} from "@common/io/enum/ResponseTypes";
import {ValidationResult} from "joi";
import {ValidationError} from "@errors/ValidationError";
import {ManufacturerService} from "@modules/manufacturer-service/service/ManufacturerService";
import Manufacturer from "@config/db/models/Manufacturer";
import { IManufacturer } from "@modules/manufacturer-service/service/io/IManufacturer";
import {IById} from "@common/io/ICustomService";
import {ManufacturerDataValidator} from "@modules/manufacturer-service/service/validator/ManufacturerDataValidator";

export class ManufacturerServiceImpl implements ManufacturerService
{
    /**
     * The singleton instance of `ManufacturerService`.
     * @private
     */

    public static instance: ManufacturerService;

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateService.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of ManufacturerService.
     *
     * @returns The singleton instance of ManufacturerService.
     */

    public static getInstance(): ManufacturerService
    {
        if(!ManufacturerServiceImpl.instance)
        {
            ManufacturerServiceImpl.instance = new ManufacturerServiceImpl(Enforce);
        }

        return ManufacturerServiceImpl.instance;
    }

    /**
     * Gets all manufacturers.
     *
     * @returns An array of all manufacturers.
     * @throws ServerError if ngo retrieval fails.
     */

    public async fetchAll(): Promise<IManufacturer | IManufacturer[]>
    {
        let manufacturers: Manufacturer[];

        try
        {
            manufacturers = await Manufacturer.findAll({
                order: [["name", "ASC"]],
            });
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to get all manufacturer with error:  ${error.message}`);
        }

       return this.validateOutput(manufacturers, ValidationTypes.ALL);
    }

    /**
     * @returns A validated array of states (`IManufacturer[]`).
     * @throws ServerError if the database query fails or validation fails.
     */

    public async fetchManufacturerByState(body: Partial<IById>): Promise<IManufacturer | IManufacturer[]>
    {

        let manufacturers: Manufacturer[];

        try
        {
            manufacturers = await Manufacturer.findAll({
                group: ["Manufacturer.manufacturer_id"],
                order: [["manufacturer_id", "ASC"]],
            });
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to get all manufacturer by manufacturer id with error:  ${error.message}`);
        }

        return this.validateOutput(manufacturers, ValidationTypes.ALL);
    }

    /**
     * Validates the output model and returns the validated model or throws an error if validation fails.
     *
     * @returns The validated model.
     * @throws ValidationError if output validation fails.
     * @param manufacturer
     * @param type
     */

    public validateOutput(manufacturer: {} | {}[], type: ValidationTypes = ValidationTypes.SINGLE): IManufacturer | IManufacturer[]
    {
        const validationMethods: Partial<Record<ValidationTypes, (data: {}) => ValidationResult>> = {
            [ValidationTypes.SINGLE]: ManufacturerDataValidator.outputValidate,
            [ValidationTypes.ALL]: ManufacturerDataValidator.outputArrayValidate
        };

        const outputValidation: ValidationResult = validationMethods[type](manufacturer);

        if (outputValidation.error)
        {
            throw new ValidationError(ValidationError.OUTPUT, outputValidation.error.message);
        }

        return outputValidation.value;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
