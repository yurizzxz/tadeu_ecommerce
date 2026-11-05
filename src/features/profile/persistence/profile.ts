import "server-only";
import { getDb } from "@/db/client";
import type { validateAddress } from "../application/validation";

export async function getProfile(userId: string) {
  return getDb().user.findUnique({ where: { id: userId }, select: { name: true, email: true, address: true } });
}

export async function updateName(userId: string, name: string) {
  await getDb().user.update({ where: { id: userId }, data: { name } });
}

export async function insertAddress(userId: string, address: NonNullable<ReturnType<typeof validateAddress>>) {
  await getDb().address.create({ data: { ...address, userId } });
}
