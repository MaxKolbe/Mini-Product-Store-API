import type Stripe from "stripe";
import db from "../db/db.js";
import logger from "../configs/logger.config.js";
import { eq, inArray } from "drizzle-orm";
import { stripe } from "../lib/stripe.js";
import { appEvents } from "../lib/events.js";
import { products } from "../db/models/products.js";
import { ORDER_EVENTS } from "../events/orders.events.js";
import { orderItem, orders } from "../db/models/orders.js";

type FulfillmentItem = {
  productId: string;
  quantity: number;
  amount: number;
};


export const fulfillOrder = async (session: Stripe.Checkout.Session): Promise<void> => {
  if (session.payment_status !== "paid") {
    logger.warn("Checkout session completed without successful payment", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });

    return;
  }

  const userId = session.metadata?.userId;

  if (!userId) {
    throw new Error(`Missing userId metadata for Stripe session ${session.id}`);
  }

  if (session.amount_total === null) {
    throw new Error(`Missing amount_total for Stripe session ${session.id}`);
  }

  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, session.id))
    .limit(1);

  if (existingOrder) {
    logger.info("Order already fulfilled", {
      orderId: existingOrder.id,
      sessionId: session.id,
    });

    return;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  if (lineItems.data.length === 0) {
    throw new Error(`No line items found for Stripe session ${session.id}`);
  }

  const items: FulfillmentItem[] = [];

  for (const lineItem of lineItems.data) {
    const stripeProduct = lineItem.price?.product;

    if (!stripeProduct || typeof stripeProduct === "string" || stripeProduct.deleted) {
      throw new Error(`Missing Stripe product for line item in session ${session.id}`);
    }

    if (lineItem.quantity === null) {
      throw new Error(`Missing quantity for line item in session ${session.id}`);
    }

    if (lineItem.amount_total === null) {
      throw new Error(`Missing amount_total for line item in session ${session.id}`);
    }

    const productId = stripeProduct.metadata.productId;

    if (!productId) {
      throw new Error(`Missing internal productId metadata for Stripe product ${stripeProduct.id}`);
    }

    items.push({
      productId,
      quantity: lineItem.quantity,
      amount: lineItem.amount_total,
    });
  }

  const productIds = items.map((item) => item.productId);

  const existingProducts = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(inArray(products.id, productIds));

  const existingProductIds = new Set(existingProducts.map((product) => product.id));
  const productNameMap = new Map(existingProducts.map((product) => [product.id, product.name]));

  const missingProductIds = productIds.filter((productId) => !existingProductIds.has(productId));

  if (missingProductIds.length > 0) {
    throw new Error(
      `Products referenced by Stripe session do not exist: ${missingProductIds.join(", ")}`,
    );
  }

  let newOrder: typeof orders.$inferSelect | undefined;

  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(orders)
      .values({
        userId,
        amount: session.amount_total!,
        status: "paid",
        stripeCheckoutSessionId: session.id,
      })
      .onConflictDoNothing({
        target: orders.stripeCheckoutSessionId,
      })
      .returning();

    if (!inserted) {
      logger.info("Order already fulfilled", {
        sessionId: session.id,
      });

      return;
    }

    await tx.insert(orderItem).values(
      items.map((item) => ({
        orderId: inserted.id,
        productId: item.productId,
        quantity: item.quantity,
        amount: item.amount,
      })),
    );

    newOrder = inserted;
  });

  if (!newOrder) {
    return;
  }

  const customerEmail = session.customer_email;

  if (!customerEmail) {
    logger.warn("Missing customer email on checkout session, skipping receipt", {
      sessionId: session.id,
    });
  } else {
    appEvents.emit(ORDER_EVENTS.ORDER_CREATED, {
      email: customerEmail,
      orderId: newOrder.id,
      amount: session.amount_total!,
      items: items.map((item) => ({
        name: productNameMap.get(item.productId) ?? "Unknown Product",
        quantity: item.quantity,
        amount: item.amount,
      })),
      createdAt: newOrder.createdAt,
    });
  }

  logger.info("Order fulfilled successfully", {
    sessionId: session.id,
    userId,
    orderId: newOrder.id,
  });
};