import * as p from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// TIMESTAMPS
const timestamps = {
  updatedAt: p.timestamp("updated_at"),
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
  deletedAt: p.timestamp("deleted_at"),
};

// USERS
export const products = p.pgTable(
  "products",
  {
    id: p
      .uuid()
      .primaryKey()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    name: p.text().notNull(),
    description: p.text().notNull(),
    price: p.integer().notNull(), 
    ...timestamps,
  },
  (table) => [
    index("products_name_idx").on(table.name),
    index("products_desc_idx").on(table.description),
    index("products_price_idx").on(table.price),
    index("products_createdat_idx").on(table.createdAt),
  ]
);

