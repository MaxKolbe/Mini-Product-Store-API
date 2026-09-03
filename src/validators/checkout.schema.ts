import * as z from "zod";

export const checkoutSchema = z.object({
  body: z.object({
    products: z.array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    ).min(1),
  }),
});

export type CheckoutType = z.infer<typeof checkoutSchema>