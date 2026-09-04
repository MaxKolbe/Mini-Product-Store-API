import { defineConfig } from "drizzle-kit";
import { env } from "./src/configs/env.config"

const dbMap = new Map([
  ["development", env.PG_DATABASE_DEV_URL!.toString()],
  ["test", env.PG_DATABASE_TEST_URL!.toString()],
  ["production", env.PG_DATABASE_PROD_URL!.toString()]
])
const dburl = dbMap.get(env.NODE_ENV!)

export default defineConfig({   
  out: "./drizzle",
  dialect: "postgresql",
  schema: "./src/db/models",  
  dbCredentials: {
    url: `${dburl}`
    // used ?sslmode=verify-full to avoid adding the ssl property
  },
});