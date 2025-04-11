import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules, ProductEvents } from "@medusajs/framework/utils";

export default async function productOptionValueCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const [value = undefined] = await productService.listProductOptionValues({ id });
    if (!value)
        return
    await translationModule.createModelTranslations([value], "product_option_value");
}

export const config: SubscriberConfig = {
    event: ProductEvents.PRODUCT_OPTION_VALUE_CREATED
};
