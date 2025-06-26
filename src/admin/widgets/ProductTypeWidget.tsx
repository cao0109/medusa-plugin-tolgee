import { defineWidgetConfig } from "@medusajs/admin-sdk";
import TranslationWidget from "../components/TranslationWidget";

export const config = defineWidgetConfig({
  zone: "product_type.details.after",
});

export default TranslationWidget("product_type");
