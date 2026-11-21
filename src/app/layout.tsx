import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = { title: "DevStore", description: "Loja de peças de informática.", alternates: { canonical: "/" }, ...(process.env.BETTER_AUTH_URL ? { metadataBase: new URL(process.env.BETTER_AUTH_URL) } : {}) };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SiteHeader /><div id="conteudo">{children}</div><footer className="site-footer"><div className="container footer-inner"><div><Link className="footer-logo" href="/">devstore<span>.</span></Link><p>Peças para o seu próximo projeto.</p></div><div><p>Explore</p><Link href="/produtos">Produtos</Link><Link href="/conta">Minha conta</Link></div><small>DevStore · Projeto demonstrativo</small></div></footer></body></html>;
}
