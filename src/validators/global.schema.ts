import * as z from "zod";

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    orderBy: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.enum(["asc", "desc"]).default("desc"),
    ),
    search: z.string().trim().optional(),
  }),
});

export type PaginationType = z.infer<typeof paginationQuerySchema>