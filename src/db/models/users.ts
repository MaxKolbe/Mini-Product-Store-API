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
export const users = p.pgTable(
  "users",
  {
    id: p
      .uuid()
      .primaryKey()
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    email: p.text().notNull().unique(),
    password: p.text().notNull(),
    ...timestamps,
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_createdat_idx").on(table.createdAt),
  ]
);

