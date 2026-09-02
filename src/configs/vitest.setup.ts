import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(import.meta.dirname, "../../.env");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}