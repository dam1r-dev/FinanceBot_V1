import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
// DATABASE_URL живёт в .env в корне монорепо, а не в packages/db.
loadEnv({ path: path.resolve(dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
