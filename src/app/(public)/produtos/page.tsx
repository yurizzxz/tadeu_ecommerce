import Link from "next/link";
import type { Metadata } from "next";
import { ProductImage } from "@/components/product-image";
import { getCatalog } from "@/features/catalog/queries/catalog";
import { parseCatalogParams } from "@/features/catalog/queries/params";
import { logServerError } from "@/lib/log-server-error";
import "./produtos.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const params = await searchParams;
  return { title: "Produtos | DevStore", description: "Explore componentes de informática na DevStore.", alternates: { canonical: "/produtos" }, ...(Object.keys(params).length ? { robots: { index: false, follow: true } } : {}) };
}
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseCatalogParams(await searchParams);
  let data: Awaited<ReturnType<typeof getCatalog>>;
  try { data = await getCatalog(filters); } catch { logServerError("catalog.list"); return <main className="container catalog-error"><h1>Não foi possível carregar os produtos.</h1><p>Tente novamente em alguns instantes.</p></main>; }
  return <main className="container catalog-page">
    <p className="breadcrumbs"><Link href="/">Início</Link> / Produtos</p>
    <div className="catalog-title"><div><p className="section-kicker">DEVSTORE / CATÁLOGO</p><h1>Encontre sua próxima peça.</h1><p>Explore os componentes para montar ou atualizar seu computador.</p></div><span>{data.products.length} {data.products.length === 1 ? "produto" : "produtos"}</span></div>
    <div className="catalog-layout"><aside className="filters"><h2>Filtros</h2><form method="get">
      <label>Buscar<input name="q" type="search" defaultValue={filters.q} placeholder="Nome, marca ou categoria" /></label>
      <label>Categoria<select name="category" defaultValue={filters.category}><option value="">Todas as categorias</option>{data.categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label>Marca<select name="brand" defaultValue={filters.brand}><option value="">Todas as marcas</option>{data.brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <fieldset><legend>Preço (R$)</legend><div className="price-fields"><label>Mínimo<input name="minPrice" inputMode="decimal" defaultValue={filters.minPrice === undefined ? "" : (filters.minPrice / 100).toFixed(2)} placeholder="0,00" /></label><label>Máximo<input name="maxPrice" inputMode="decimal" defaultValue={filters.maxPrice === undefined ? "" : (filters.maxPrice / 100).toFixed(2)} placeholder="0,00" /></label></div></fieldset>
      <label className="checkbox-label"><input name="available" type="checkbox" value="1" defaultChecked={filters.available} /> Somente disponíveis</label>
      <button className="button button-primary" type="submit">Aplicar filtros</button><Link className="clear-filters" href="/produtos">Limpar filtros</Link>
    </form></aside><section aria-label="Resultados do catálogo">{data.products.length ? <div className="product-grid catalog-products">{data.products.map((product) => <Link href={`/produtos/${product.slug}`} className="product-card" key={product.id}><div className="product-image"><ProductImage src={product.imageUrl} alt={product.name} /></div><div className="product-info"><p className="product-brand">{product.brand.name} · {product.category.name}</p><h2>{product.name}</h2><p className="product-price">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.priceInCents / 100)}</p><span className={product.stock > 0 ? "availability" : "availability unavailable"}>{product.stock > 0 ? "Disponível" : "Indisponível"}</span></div></Link>)}</div> : <div className="catalog-empty"><h2>Nenhum produto encontrado.</h2><p>Tente ajustar sua busca ou seus filtros.</p><Link className="text-link" href="/produtos">Limpar filtros</Link></div>}</section></div>
  </main>;
}
