import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { normalizeName } from "@/features/auth/application/name";

function createAuth() {
  if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
    throw new Error("Configuração de autenticação ausente");
  }
  return betterAuth({
      database: prismaAdapter(getDb(), { provider: "postgresql" }),
      emailAndPassword: { enabled: true, requireEmailVerification: false },
      disabledPaths: ["/update-user", "/change-password", "/set-password", "/change-email", "/delete-user", "/request-password-reset", "/reset-password"],
      databaseHooks: {
        user: { create: { before: async (user) => {
          const name = normalizeName(user.name);
          if (!name) return false;
          return { data: { ...user, name } };
        } } },
      },
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL,
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return auth ??= createAuth(); }

export async function getSession() {
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}
