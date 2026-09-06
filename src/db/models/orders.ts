import * as p from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { products } from "./products.js";

export const order = p.pgTable("order", {
  id: p
    .uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey(),
  userId: p
    .uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: p.integer().notNull(),
  status: p.text().notNull(),
  stripeCheckoutSessionId: p.text("stripe_checkout_session_id").notNull().unique(),
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
  updatedAt: p.timestamp("updated_at").defaultNow().notNull(),
});

export const orderItem = p.pgTable("order_item", {
  id: p
    .uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey(),
  orderId: p
    .uuid("order_id")
    .notNull()
    .references(() => order.id),
  productId: p
    .uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: p.integer().notNull(),
  amount: p.integer().notNull(),
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
});
