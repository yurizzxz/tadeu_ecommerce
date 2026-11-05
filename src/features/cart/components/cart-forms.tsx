"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addItem, removeItem, updateItem } from "../application/actions";

const initial = { message: "", success: false };

export function AddToCart({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(addItem, initial);
  return <div><form action={action}><input type="hidden" name="productId" value={productId} /><input type="hidden" name="quantity" value="1" /><button className="button button-primary" disabled={pending}>{pending ? "Adicionando..." : "Adicionar ao carrinho"}</button></form>{state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}<Link className="text-link" href="/carrinho">Ver carrinho</Link></div>;
}

export function CartItemControls({ itemId, quantity, stock }: { itemId: string; quantity: number; stock: number }) {
  const [update, updateAction, updating] = useActionState(updateItem, initial);
  const [remove, removeAction, removing] = useActionState(removeItem, initial);
  return <div className="cart-controls"><form action={updateAction}><input type="hidden" name="itemId" value={itemId} /><label>Quantidade<input type="number" name="quantity" min="1" max={Math.max(stock, 1)} defaultValue={quantity} required /></label><button className="button button-outline" disabled={updating || removing}>{updating ? "Salvando..." : "Atualizar"}</button></form><form action={removeAction}><input type="hidden" name="itemId" value={itemId} /><button className="cart-remove" disabled={updating || removing}>Remover</button></form>{update.message && <p role={update.success ? "status" : "alert"}>{update.message}</p>}{remove.message && <p role={remove.success ? "status" : "alert"}>{remove.message}</p>}</div>;
}
