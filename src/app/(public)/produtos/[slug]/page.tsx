import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { getProduct } from "@/features/catalog/queries/product";
import { getSession } from "@/lib/auth/server";
import { AddToCart } from "@/features/cart/components/cart-forms";
import "./produto.css";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Produto não encontrado", robots: { index: false } };
  return { title: `${product.name} | DevStore`, description: product.description, alternates: { canonical: `/produtos/${product.slug}` } };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const session = await getSession();
  const specs = product.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications)
    ? Object.entries(product.specifications) : [];
  return <main className="container product-detail">
    <Link className="back-link" href="/produtos"><ArrowLeft size={16} aria-hidden="true" /> Voltar para produtos</Link>
    <div className="detail-grid"><div className="detail-image"><ProductImage src={product.imageUrl} alt={product.name} /></div>
      <div className="detail-content"><p className="section-kicker">{product.category.name} / {product.brand.name}</p><h1>{product.name}</h1><p className="detail-sku">SKU: {product.sku}</p><p className="detail-price">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.priceInCents / 100)}</p><p className={product.stock > 0 ? "availability" : "availability unavailable"}>{product.stock > 0 ? "Disponível" : "Indisponível"}</p><p className="detail-description">{product.description}</p>
        {product.stock === 0 ? <button className="button detail-button" disabled>Produto indisponível</button> : session ? <AddToCart productId={product.id} /> : <Link href="/entrar" className="button button-primary">Entre para adicionar ao carrinho</Link>}
      </div></div>
    <section className="detail-specs"><h2>Especificações</h2>{specs.length ? <dl>{specs.map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{Array.isArray(value) ? value.join(", ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "—")}</dd></div>)}</dl> : <p>Especificações indisponíveis.</p>}</section>
  </main>;
}
