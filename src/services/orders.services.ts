import { eq, desc, asc, count, inArray } from "drizzle-orm";
import db from "../db/db.js";
import { orders, orderItem } from "../db/models/orders.js";
import { products } from "../db/models/products.js";
import { PaginationType } from "../validators/global.schema.js";

export const listOrders = async (
  userId: string,
  query: PaginationType["query"],
  correlationId: string,
) => {
  const { page, limit, orderBy } = query;
  const offset = (page - 1) * limit;

  // Determine sort direction
  const sortOrder =
    orderBy === "asc"
      ? asc(orders.createdAt)
      : desc(orders.createdAt);

  // Run data + count queries in parallel
  const [data, [totalRecords]] = await Promise.all([
    db
      .select({
        id: orders.id,
        amount: orders.amount,
        status: orders.status,
        stripeCheckoutSessionId: orders.stripeCheckoutSessionId,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.userId, userId)),
  ]);

  // Fetch order items with product info for all returned orders
  const orderIds = data.map((order) => order.id);

  let itemsByOrderId: Record<string, {
    productId: string;
    quantity: number;
    amount: number;
    product: { name: string; price: number };
  }[]> = {};

  if (orderIds.length > 0) {
    const items = await db
      .select({
        orderId: orderItem.orderId,
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        amount: orderItem.amount,
        productName: products.name,
        productPrice: products.price,
      })
      .from(orderItem)
      .innerJoin(products, eq(orderItem.productId, products.id))
      .where(inArray(orderItem.orderId, orderIds));

    for (const item of items) {
      if (!itemsByOrderId[item.orderId]) {
        itemsByOrderId[item.orderId] = [];
      }

      itemsByOrderId[item.orderId]!.push({
        productId: item.productId,
        quantity: item.quantity,
        amount: item.amount,
        product: {
          name: item.productName,
          price: item.productPrice,
        },
      });
    }
  }

  const ordersWithItems = data.map((order) => ({
    ...order,
    items: itemsByOrderId[order.id] ?? [],
  }));

  const totalPages = Math.ceil(totalRecords!.count / limit);

  return {
    code: 200,
    message: "orders retrieved successfully",
    data: ordersWithItems,
    meta: {
      correlationId,
      pagination: {
        page,
        limit,
        totalRecords: totalRecords!.count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };
};
