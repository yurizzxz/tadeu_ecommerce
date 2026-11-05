import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { SignOut } from "@/features/auth/components/sign-out";
import Link from "next/link";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  return <main><h1>Minha conta</h1><p>Olá, {session.user.name}.</p><p><Link href="/perfil">Editar perfil e endereço</Link></p><SignOut /></main>;
}
