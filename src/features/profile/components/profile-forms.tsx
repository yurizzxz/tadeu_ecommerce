"use client";

import { useActionState } from "react";
import { saveAddress, saveName } from "../application/actions";

const initialState = { message: "", success: false };

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(saveName, initialState);
  return <form action={action} className="profile-form">
    <label>Nome<input name="name" defaultValue={name} required autoComplete="name" /></label>
    <button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Salvar nome"}</button>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </form>;
}

export function AddressForm() {
  const [state, action, pending] = useActionState(saveAddress, initialState);
  return <form action={action} className="profile-form">
    <label>CEP<input name="postalCode" required autoComplete="postal-code" inputMode="numeric" placeholder="00000-000" /></label>
    <label>Rua<input name="street" required autoComplete="address-line1" /></label>
    <label>Número<input name="number" required /></label>
    <label>Complemento <span>(opcional)</span><input name="complement" autoComplete="address-line2" /></label>
    <label>Bairro<input name="neighborhood" required /></label>
    <label>Cidade<input name="city" required autoComplete="address-level2" /></label>
    <label>UF<input name="state" required minLength={2} maxLength={2} autoComplete="address-level1" /></label>
    <button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Cadastrar endereço"}</button>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </form>;
}
