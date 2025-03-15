import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import listShippingOptionsForCartWithTranslationsWorkflow from "../../../../workflows/shipping-options-with-translations"

export const GET = async (
    req: MedusaRequest<{}, HttpTypes.StoreGetShippingOptionList>,
    res: MedusaResponse<HttpTypes.StoreShippingOptionListResponse>
) => {
    const { cart_id, is_return, country_code } = req.query

    try {
        const workflow = listShippingOptionsForCartWithTranslationsWorkflow(req.scope)
        const { result: shipping_options } = await workflow.run({
            input: { cart_id: cart_id as string, is_return: !!is_return, country_code: country_code as string },
        })

        res.json({ shipping_options })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: e.message } as any)
    }
}
