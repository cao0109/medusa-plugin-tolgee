import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules, ProductEvents } from "@medusajs/framework/utils";

export default async function productOptionCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const option = await productService.retrieveProductOption(id);
    await translationModule.createModelTranslations([option], "product_option");
}

export const config: SubscriberConfig = {
    event: ProductEvents.PRODUCT_OPTION_CREATED
};
