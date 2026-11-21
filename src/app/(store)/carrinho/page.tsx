import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getCart } from "@/features/cart/persistence/cart";
import { CartItemControls } from "@/features/cart/components/cart-forms";
import { ProductImage } from "@/components/product-image";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import "./carrinho.css";

export const metadata: Metadata = { title: "Carrinho | DevStore", robots: { index: false, follow: false } };
const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const cart = await getCart(session.user.id);
  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.priceInCents, 0);
  return <main className="container cart-page">
    <Link className="cart-back" href="/produtos"><ArrowLeft size={16} /> Continuar comprando</Link>
    <div className="cart-heading"><div><p className="section-kicker">SEU PEDIDO</p><h1>Meu carrinho</h1></div>{items.length > 0 && <p>{items.length} {items.length === 1 ? "produto" : "produtos"}</p>}</div>
    {items.length === 0 ? <div className="cart-empty"><span><ShoppingBag size={28} /></span><h2>Seu carrinho está vazio</h2><p>Explore as peças disponíveis e encontre o que você precisa.</p><Link className="button button-primary" href="/produtos">Explorar produtos <ArrowRight size={17} /></Link></div> : <div className="cart-layout"><section aria-label="Produtos no carrinho"><ul className="cart-items">{items.map((item) => {
      const unavailable = !item.product.isActive || item.product.stock === 0;
      const insufficient = item.quantity > item.product.stock;
      return <li key={item.id}><Link className="cart-image" href={`/produtos/${item.product.slug}`}><ProductImage src={item.product.imageUrl} alt={item.product.name} /></Link><div className="cart-item-main"><div className="cart-item-heading"><div><h2><Link href={`/produtos/${item.product.slug}`}>{item.product.name}</Link></h2><p className="cart-unit">{money(item.product.priceInCents)} por unidade</p><p className={unavailable || insufficient ? "availability unavailable" : "availability"}>{unavailable ? "Produto indisponível" : insufficient ? `Estoque atual: ${item.product.stock}` : "Disponível"}</p></div><div className="cart-subtotal"><span>Subtotal</span><strong>{money(item.product.priceInCents * item.quantity)}</strong></div></div><CartItemControls itemId={item.id} quantity={item.quantity} stock={item.product.stock} /></div></li>;
    })}</ul></section><aside className="cart-summary" aria-labelledby="cart-summary-title"><h2 id="cart-summary-title">Resumo do pedido</h2><div className="cart-summary-row"><span>Produtos</span><span>{money(total)}</span></div><div className="cart-summary-total"><span>Total</span><strong>{money(total)}</strong></div><Link className="button button-primary" href="/checkout">Revisar pedido <ArrowRight size={17} /></Link></aside></div>}
  </main>;
}
