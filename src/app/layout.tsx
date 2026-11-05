import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Cpu } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = { title: "DevStore", description: "Loja de peças de informática.", alternates: { canonical: "/" }, ...(process.env.BETTER_AUTH_URL ? { metadataBase: new URL(process.env.BETTER_AUTH_URL) } : {}) };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><header className="site-header"><div className="container header-inner"><Link className="logo" href="/" aria-label="DevStore, início"><span className="logo-mark"><Cpu size={19} /></span>dev<span>store</span><i>.</i></Link><nav aria-label="Navegação principal"><Link href="/produtos">Produtos</Link><Link href="/entrar">Minha conta <ArrowUpRight size={15} aria-hidden="true" /></Link></nav></div></header><div id="conteudo">{children}</div><footer className="site-footer"><div className="container footer-inner"><div><Link className="footer-logo" href="/">devstore<span>.</span></Link><p>Peças para o seu próximo projeto.</p></div><div><p>Explore</p><Link href="/produtos">Produtos</Link><Link href="/entrar">Minha conta</Link></div><small>DevStore · Projeto demonstrativo</small></div></footer></body></html>;
}
