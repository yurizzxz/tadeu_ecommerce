"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/server";
import { logServerError } from "@/lib/log-server-error";
import { insertAddress, updateName } from "../persistence/profile";
import { validateAddress, validateName } from "./validation";

export type ActionState = { message: string; success: boolean };

export async function saveName(_previous: ActionState, form: FormData): Promise<ActionState> {
  const name = validateName(form.get("name"));
  if (!name) return { message: "Informe um nome válido.", success: false };
  try {
    const session = await getSession();
    if (!session) return { message: "Entre na sua conta para continuar.", success: false };
    await updateName(session.user.id, name);
    revalidatePath("/perfil");
    revalidatePath("/conta");
    return { message: "Nome atualizado.", success: true };
  } catch {
    logServerError("profile.name");
    return { message: "Não foi possível atualizar o nome. Tente novamente.", success: false };
  }
}

export async function saveAddress(_previous: ActionState, form: FormData): Promise<ActionState> {
  const address = validateAddress(form);
  if (!address) return { message: "Confira os campos obrigatórios, o CEP e a UF.", success: false };
  try {
    const session = await getSession();
    if (!session) return { message: "Entre na sua conta para continuar.", success: false };
    await insertAddress(session.user.id, address);
    revalidatePath("/perfil");
    return { message: "Endereço cadastrado.", success: true };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { message: "Você já possui um endereço cadastrado.", success: false };
    }
    logServerError("profile.address");
    return { message: "Não foi possível cadastrar o endereço. Tente novamente.", success: false };
  }
}
