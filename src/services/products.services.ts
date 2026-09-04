import { products } from "../db/models/products.js";
import { PaginationType } from "../validators/global.schema.js";
import { asc, desc, ilike, or, count } from "drizzle-orm";
import db from "../db/db.js";

export const listProducts = async (
  query: PaginationType["query"],
  correlationId: string,
) => {
  const { page, limit, orderBy, search } = query;
  const offset = (page - 1) * limit;

  // Build optional search filter
  const whereClause =
    search !== undefined
      ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
        )
      : undefined;

  // Determine sort direction
  const sortOrder =
    orderBy === "asc"
      ? asc(products.createdAt)
      : desc(products.createdAt);

  // Run data + count queries in parallel
  const [data, [ totalRecords ]] = await Promise.all([
    db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(products)
      .where(whereClause),
  ]);

  const totalPages = Math.ceil(totalRecords!.count / limit);

  return {
    code: 200,
    message: "products retrieved successfully",
    data,
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