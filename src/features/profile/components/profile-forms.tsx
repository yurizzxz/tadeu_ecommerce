"use client";

import { useActionState, useState, type FormEvent } from "react";
import { saveAddress, saveName } from "../application/actions";
import { addressFieldError } from "../application/validation";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate(event: FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    for (const key of ["postalCode", "street", "number", "neighborhood", "city", "state"]) {
      const error = addressFieldError(key, String(form.get(key) ?? ""));
      if (error) next[key] = error;
    }
    setErrors(next);
    if (Object.keys(next).length) event.preventDefault();
  }
  const feedback = (key: string) => errors[key] && <span id={`${key}-error`} role="alert">{errors[key]}</span>;
  const invalid = (key: string) => ({ "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${key}-error` : undefined });
  return <form action={action} onSubmit={validate} noValidate className="profile-form">
    <label>CEP<input name="postalCode" required autoComplete="postal-code" inputMode="numeric" placeholder="00000-000" {...invalid("postalCode")} />{feedback("postalCode")}</label>
    <label>Rua<input name="street" required autoComplete="address-line1" {...invalid("street")} />{feedback("street")}</label>
    <label>Número<input name="number" required {...invalid("number")} />{feedback("number")}</label>
    <label>Complemento <span>(opcional)</span><input name="complement" autoComplete="address-line2" /></label>
    <label>Bairro<input name="neighborhood" required {...invalid("neighborhood")} />{feedback("neighborhood")}</label>
    <label>Cidade<input name="city" required autoComplete="address-level2" {...invalid("city")} />{feedback("city")}</label>
    <label>UF<input name="state" required minLength={2} maxLength={2} autoComplete="address-level1" {...invalid("state")} />{feedback("state")}</label>
    <button className="button button-primary" disabled={pending}>{pending ? "Salvando..." : "Cadastrar endereço"}</button>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </form>;
}
