import * as z from "zod";

export const productsSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3),
    description: z.string().trim().min(3),
    price: z.preprocess(
      (v) => {
        const parsed = Number(v);
        return Number.isFinite(parsed) ? Math.round(parsed * 100) : v;
      },
      z.number().int().positive().gt(70000, "Item's price must be greater than N700"),
    ),
  }),
});

export const updateProductSchema = z.object({
  body: productsSchema.shape.body.partial(),
});

export const productParamsSchema = z.object({
  params: z.object({
    productId: z.uuid(),
  }),
});
