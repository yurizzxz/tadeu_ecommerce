import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const globalForPrisma = globalThis as typeof globalThis & { devstorePrisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  if (!globalForPrisma.devstorePrisma) {
    globalForPrisma.devstorePrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }
  return globalForPrisma.devstorePrisma;
}
