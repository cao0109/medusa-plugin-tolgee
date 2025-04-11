import type { AdminCollection, AdminProduct, AdminProductCategory, AdminProductTag, AdminProductType, AdminProductVariant, AdminShippingOption, ProductCategoryDTO, ProductCollectionDTO, ProductDTO, ProductTagDTO, ProductTypeDTO, ProductVariantDTO, ShippingOptionDTO } from "@medusajs/framework/types";
import { FulfillmentEvents, ProductEvents } from "@medusajs/framework/utils";

interface SupportedModelsMap {
    product: AdminProduct;
    product_category: AdminProductCategory;
    product_collection: AdminCollection;
    product_variant: AdminProductVariant;
    product_type: AdminProductType;
    product_tag: AdminProductTag;
    shipping_option: AdminShippingOption;
}

const deletionEventsMap = {
    product: ProductEvents.PRODUCT_DELETED,
    product_category: ProductEvents.PRODUCT_CATEGORY_DELETED,
    product_collection: ProductEvents.PRODUCT_COLLECTION_DELETED,
    product_variant: ProductEvents.PRODUCT_VARIANT_DELETED,
    product_type: ProductEvents.PRODUCT_TYPE_DELETED,
    product_tag: ProductEvents.PRODUCT_TAG_DELETED,
    shipping_option: FulfillmentEvents.SHIPPING_OPTION_DELETED
} satisfies Record<SupportedModels, unknown>;

export const defaultSupportedProperties = {
    product: ["title", "subtitle", "description"],
    product_category: ["name", "description"],
    product_collection: ["title"],
    product_variant: ["title"],
    product_type: ["value"],
    product_tag: ["value"],
    shipping_option: ["name"]
} satisfies Record<SupportedModels, unknown>;

export type ModelDTO =
    | ProductDTO
    | ProductCategoryDTO
    | ProductCollectionDTO
    | ProductTagDTO
    | ProductTypeDTO
    | ProductVariantDTO
    | ShippingOptionDTO

export type TolgeeAdminOptions = {
    defaultLanguage: Language["tag"];
    availableLanguages: Language[];
    apiKey: string;
    apiUrl: string;
}

export const deletionEvents = Object.values(deletionEventsMap);
export type SupportedModels = keyof SupportedModelsMap;
export type WidgetType<K extends SupportedModels> = SupportedModelsMap[K];

interface Language {
    label: string;
    tag: string;
}
