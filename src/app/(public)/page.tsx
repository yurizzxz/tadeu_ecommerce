import Link from "next/link";
import { ArrowDownRight, ArrowRight, Cpu, PackageCheck, ShieldCheck } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { getHomeCatalog } from "@/features/catalog/queries/home";

export const dynamic = "force-dynamic";

export default async function Home() {
  let catalog: Awaited<ReturnType<typeof getHomeCatalog>>;
  try { catalog = await getHomeCatalog(); } catch {
    return <main className="container catalog-error"><h1>Não foi possível carregar a loja.</h1><p>Tente novamente em alguns instantes.</p></main>;
  }
  return (
    <main>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="hero-label"><span aria-hidden="true" /> PEÇAS PARA O SEU SETUP</span>
          <h1 id="hero-title">Seu próximo<br /><em>upgrade</em> começa aqui.</h1>
          <p>Encontre os componentes certos para montar, renovar e fazer mais com o seu computador.</p>
          <Link className="button button-primary" href="/produtos">Explorar produtos <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="hero-panel-top"><span>DEVSTORE / HARDWARE</span><Cpu size={23} strokeWidth={1.5} /></div>
          <div className="hero-chip"><Cpu size={96} strokeWidth={0.8} /></div>
          <div className="hero-panel-bottom"><span>COMPONENTES<br />PARA O QUE VEM</span><ArrowDownRight size={28} /></div>
        </div>
      </section>
      <section className="benefits" aria-label="Informações da loja"><div className="container benefits-inner">
        <p><PackageCheck size={20} aria-hidden="true" /><span>Peças para montar ou atualizar</span></p>
        <p><ShieldCheck size={20} aria-hidden="true" /><span>Pedido simples e seguro</span></p>
        <p><Cpu size={20} aria-hidden="true" /><span>Componentes para o seu setup</span></p>
      </div></section>
      <section className="section container" aria-labelledby="categories-title">
        <div className="section-head"><div><p className="section-kicker">COMECE POR AQUI</p><h2 id="categories-title">Encontre por categoria.</h2></div><Link className="text-link" href="/produtos">Ver todos <ArrowRight size={17} aria-hidden="true" /></Link></div>
        {catalog.categories.length ? <div className="category-grid">{catalog.categories.map((category, index) => <Link className="category-link" key={category.id} href={`/produtos?category=${encodeURIComponent(category.slug)}`}><span className="category-index">{String(index + 1).padStart(2, "0")}</span><span>{category.name}</span><ArrowDownRight size={20} aria-hidden="true" /></Link>)}</div> : <p>Nenhuma categoria disponível no momento.</p>}
      </section>
      <section className="section section-products" aria-labelledby="products-title"><div className="container">
        <div className="section-head"><div><p className="section-kicker">ESCOLHAS DA LOJA</p><h2 id="products-title">Em destaque.</h2><p className="section-description">Uma seleção para dar o próximo passo no seu setup.</p></div><Link className="text-link" href="/produtos">Ver catálogo <ArrowRight size={17} aria-hidden="true" /></Link></div>
        {catalog.products.length ? <div className="product-grid">{catalog.products.map((product) => <Link href={`/produtos/${product.slug}`} className="product-card" key={product.id}><div className="product-image"><ProductImage src={product.imageUrl} alt={product.name} /></div><div className="product-info"><p className="product-brand">{product.brand.name}</p><h3>{product.name}</h3><p className="product-price">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.priceInCents / 100)}</p><span className={product.stock > 0 ? "availability" : "availability unavailable"}>{product.stock > 0 ? "Disponível" : "Indisponível"}</span></div></Link>)}</div> : <p>Nenhum produto disponível no momento.</p>}
      </div></section>
      <section className="closing container"><div><p className="section-kicker">SEU PRÓXIMO PROJETO</p><h2>Boas ideias merecem<br />bons componentes.</h2></div><Link className="button button-outline" href="/produtos">Encontrar peças <ArrowRight size={18} aria-hidden="true" /></Link></section>
    </main>
  );
}
