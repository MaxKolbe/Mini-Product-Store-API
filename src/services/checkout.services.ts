import { CheckoutType } from "../validators/checkout.schema.js";
import { createSession } from "./stripe.services.js";
import { products } from "../db/models/products.js";
import { LineItems } from "../types/checkout.js";
import { inArray } from "drizzle-orm";
import db from "../db/db.js";

export const checkout = async (body: CheckoutType["body"], correlationId: string, email: string) => {
  const productIds = body.products.map((p) => p.productId);
  const qtyArr = body.products.map((p) => p.quantity);

  const results = await db
    .select()
    .from(products)
    .where(inArray(products.id, [...productIds]));

  const lineItems: LineItems = results.map((result, index) => ({
    price_data: {
      currency: "NGN",
      product_data: {
        name: result.name,
        description: result.description,
      },
      unit_amount: result.price,
    },
    quantity: qtyArr[index]!,
  }));

  const session = await createSession(lineItems, email)

  // emitter to log details for auditing

  return {
    code: 200,
    message: "checkout session created successfully",
    data: {
      url: session.url
    },
    meta: {
      correlationId,
    },
  };
};
