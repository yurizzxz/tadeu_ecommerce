"use client";

import { useActionState, useEffect, useState } from "react";
import { cancelOrderAction } from "../application/actions";

export function CancelForm({ id, deadline }: { id: string; deadline: string }) {
  const [confirming, setConfirming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const [state, action, pending] = useActionState(cancelOrderAction, { message: "", success: false });
  if (state.success) return <p role="status">{state.message}</p>;
  return <div><p>Tempo estimado restante: {remaining === null ? "calculando" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}. O prazo é validado pelo servidor.</p>{!confirming ? <button type="button" className="button button-outline" onClick={() => setConfirming(true)}>Cancelar pedido</button> : <form action={action}><p>Deseja cancelar este pedido?</p><input type="hidden" name="orderId" value={id} /><input type="hidden" name="confirm" value="yes" /><button className="button button-primary" disabled={pending}>{pending ? "Cancelando..." : "Confirmar cancelamento"}</button> <button type="button" className="button button-outline" onClick={() => setConfirming(false)}>Voltar</button></form>}{state.message && <p role="alert">{state.message}</p>}</div>;
}
