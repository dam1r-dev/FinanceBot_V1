import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __financeBotPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Reuse a single instance across hot reloads / serverless invocations in the
// same runtime to avoid exhausting Postgres connections.
export const prisma = globalThis.__financeBotPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__financeBotPrisma = prisma;
}
