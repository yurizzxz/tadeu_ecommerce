"use client";

import Link from "next/link";
import { useRef } from "react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";

type Category = { name: string; slug: string };
export function SiteNavigation({ categories, name }: { categories: Category[]; name: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return <>
    <nav className="desktop-navigation" aria-label="Navegação principal"><Link href="/produtos">Produtos</Link><details className="category-menu"><summary>Categorias</summary><div className="category-dropdown">{categories.map((category) => <Link key={category.slug} href={`/produtos?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>)}<Link href="/produtos">Ver todos os produtos</Link></div></details></nav>
    <div className="header-actions"><Link className="header-account" href={name ? "/conta" : "/entrar"}><UserRound size={20} /><span><small>{name ? `Olá, ${name}` : "Boas-vindas"}</small><strong>{name ? "Minha conta" : "Entre ou cadastre-se"}</strong></span></Link><Link className="header-cart" href="/carrinho" aria-label="Carrinho"><ShoppingBag size={21} /><span>Carrinho</span></Link><button className="mobile-menu-trigger" type="button" aria-label="Abrir menu" onClick={() => dialog.current?.showModal()}><Menu size={24} /></button></div>
    <dialog ref={dialog} className="mobile-sheet" aria-labelledby="mobile-menu-title" onClick={(event) => { if (event.target === dialog.current) close(); }}><div className="sheet-content"><div className="sheet-heading"><strong id="mobile-menu-title">Menu</strong><button type="button" onClick={close} aria-label="Fechar menu"><X size={22} /></button></div><Link className="sheet-account" href={name ? "/conta" : "/entrar"} onClick={close}><UserRound size={20} /><span>{name ? `Olá, ${name} · Minha conta` : "Entre ou cadastre-se"}</span></Link><nav aria-label="Menu mobile"><Link href="/produtos" onClick={close}>Todos os produtos</Link><Link href="/carrinho" onClick={close}>Carrinho</Link><p>Categorias</p>{categories.map((category) => <Link key={category.slug} href={`/produtos?category=${encodeURIComponent(category.slug)}`} onClick={close}>{category.name}</Link>)}</nav></div></dialog>
  </>;
}
