import { CheckoutType } from "../validators/checkout.schema.js";
import { createSession } from "./stripe.services.js";
import { products } from "../db/models/products.js";
import { LineItems } from "../types/checkout.js";
import { inArray } from "drizzle-orm";
import db from "../db/db.js";
import { ValidationError } from "../lib/error.js";

export const checkout = async (
  body: CheckoutType["body"],
  correlationId: string,
  user: { id: string; email: string;},
) => {
  const productIds = body.products.map((p) => p.productId);

  const results = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const foundIds = new Set(results.map((result) => result.id));
  const missingIds = productIds.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    throw new ValidationError("Product ID invalid", {
      missingIds,
    });
  }

  const quantityMap = new Map(
    body.products.map((product) => [product.productId, product.quantity]),
  );

  const lineItems: LineItems = results.map((result) => ({
    price_data: {
      currency: "NGN",
      product_data: {
        name: result.name,
        description: result.description,
        metadata: {
          productId: result.id,
        }
      },
      unit_amount: result.price,
    },
    quantity: quantityMap.get(result.id)!,
  }));

  const session = await createSession(lineItems, user.email, user.id);

  // emitter to log details for auditing

  return {
    code: 200,
    message: "checkout session created successfully",
    data: {
      url: session.url,
    },
    meta: {
      correlationId,
    },
  };
};
