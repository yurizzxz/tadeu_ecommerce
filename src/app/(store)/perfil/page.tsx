import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getProfile } from "@/features/profile/persistence/profile";
import { AddressForm, NameForm } from "@/features/profile/components/profile-forms";
import "./perfil.css";

export const metadata: Metadata = { title: "Perfil | DevStore", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/entrar");
  const address = profile.address;
  return <main className="container profile-page">
    <h1>Meu perfil</h1>
    <section><h2>Dados pessoais</h2><p>E-mail: {profile.email}</p><NameForm name={profile.name} /></section>
    <section><h2>Endereço</h2>{address ? <div><p>{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}</p><p>{address.neighborhood} — {address.city}/{address.state}</p><p>CEP: {address.postalCode}</p></div> : <><p>Cadastre seu endereço para finalizar pedidos.</p><AddressForm /></>}</section>
  </main>;
}
