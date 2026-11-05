"use client";

import { useActionState } from "react";
import { confirmCheckout } from "../application/actions";

export function ConfirmForm({ fingerprint, disabled }: { fingerprint: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(confirmCheckout, { message: "", success: false });
  return <form action={action}><input type="hidden" name="review" value={fingerprint} /><button className="button button-primary" disabled={pending || disabled}>{pending ? "Finalizando..." : "Finalizar pedido"}</button>{state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}</form>;
}
