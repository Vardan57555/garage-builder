import {StateService} from "@modules/states-service/services/StateService";
import {InstantiationError} from "@errors/InstantiationError";
import State from "@config/db/models/State";
import {ServerError} from "@errors/ServerError";
import {IById} from "@common/io/ICustomService";
import StateManufacturerBuildingMapping from "@config/db/models/StateManufacturerBuildingMapping";
import {ValidationTypes} from "@common/io/enum/ResponseTypes";
import {ValidationResult} from "joi";
import {IState} from "@modules/states-service/services/io/IState";
import {ValidationError} from "@errors/ValidationError";
import {StateDataValidator} from "@modules/states-service/services/validator/StateDataValidator";

export class StateServiceImpl implements StateService
{
    /**
     * The singleton instance of `StateService`.
     * @private
     */

    public static instance: StateService;

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
     * Gets the singleton instance of StateService.
     *
     * @returns The singleton instance of StateService.
     */

    public static getInstance(): StateService
    {
        if(!StateServiceImpl.instance)
        {
            StateServiceImpl.instance = new StateServiceImpl(Enforce);
        }

        return StateServiceImpl.instance;
    }

    /**
     * @returns A validated array of states (`IState[]`).
     * @throws ServerError if the database query fails or validation fails.
     */

    public async fetchAll(): Promise<IState | IState[]>
    {
        let states: State[];

        try
        {
            states = await State.findAll();
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to get all states with error:  ${error.message}`);
        }

        return this.validateOutput(states, ValidationTypes.ALL);
    }

    /**
     * @param body - An object containing the manufacturer ID (`Partial<IById>`).
     * @param body.manufacturer_id - The ID of the manufacturer for which to fetch states.
     * @returns A validated array of states (`IState[]`) associated with the manufacturer.
     * @throws ServerError.NOT_FOUND if no states are found for the given manufacturer.
     * @throws ServerError.INTERNAL if the database query or validation fails.
     */

    public async fetchByManufacturerId(body: Partial<IById>): Promise<IState | IState[]>
    {
        let { manufacturer_id } = body;

        let states: State[];

        try
        {
            states = await State.findAll({
                include: [
                    {
                        model: StateManufacturerBuildingMapping,
                        required: true,
                        where: { manufacturer_id },
                        attributes: [],
                    },
                ],
                group: ["State.state_id"],
                order: [["name", "ASC"]],
            });
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to get all states with error:  ${error.message}`);
        }

        if(!states.length)
        {
            throw new ServerError(ServerError.NOT_FOUND, `State with ID ${manufacturer_id} does not exist`);
        }

        return this.validateOutput(states, ValidationTypes.ALL);
    }

    /**
     * Validates the output model and returns the validated model or throws an error if validation fails.
     *
     * @returns The validated model.
     * @throws ValidationError if output validation fails.
     * @param state
     * @param type
     */
    public validateOutput(state: {} | {}[], type: ValidationTypes = ValidationTypes.SINGLE): IState | IState[]
    {
        const validationMethods: Partial<Record<ValidationTypes, (data: {}) => ValidationResult>> = {
            [ValidationTypes.SINGLE]: StateDataValidator.outputValidate,
            [ValidationTypes.ALL]: StateDataValidator.outputArrayValidate
        };

        const outputValidation: ValidationResult = validationMethods[type](state);

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



