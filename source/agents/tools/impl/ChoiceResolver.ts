import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {GenericChoiceManager} from "@agents/tools/impl/GenericChoiceManager";
import {ChoiceResult} from "@agents/tools/io/IChoiceHandler";

export class ChoiceResolver
{
    private choiceManager: GenericChoiceManager = new GenericChoiceManager();

    async resolve(field: keyof UserFriendlyParams, value: any): Promise<any>
    {
        if (field !== "roof_type") return value;

        const isExplicit = /^(vertical|regular|box|a-frame)$/i.test(String(value));
        if (isExplicit)
        {
            return value;
        }

        const choice: ChoiceResult = await this.choiceManager.handleChoice("roof_type", String(value));
        return choice.selected;
    }
}
