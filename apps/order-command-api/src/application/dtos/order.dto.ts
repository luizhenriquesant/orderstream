import Zod from 'zod/v4';

export const CreateOrderDtoSchema = Zod.object({
    customerId: Zod.string(),
    items: Zod.array(Zod.object({
        sku: Zod.string(),
        quantity: Zod.number().int().positive(),
        unitPrice: Zod.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    })).min(1, "At least one item is required"),
    currency: Zod.string().length(3, "Currency must be a 3-letter code"),
})

export const CreateOrderSuccessReponseSchema = Zod.object({
    orderId: Zod.string(),
})

export type CreateOrderDto = Zod.infer<typeof CreateOrderDtoSchema>;
export type CreateOrderSuccessResponse = Zod.infer<typeof CreateOrderSuccessReponseSchema>;