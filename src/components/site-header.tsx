import Link from "next/link";
import { Cpu } from "lucide-react";
import { getSession } from "@/lib/auth/server";
import { getDb } from "@/db/client";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeader() {
  const [session, categories] = await Promise.all([
    getSession().catch(() => null),
    Promise.resolve().then(() => getDb().category.findMany({ where: { products: { some: { isActive: true } } }, select: { name: true, slug: true }, orderBy: { name: "asc" } })).catch(() => []),
  ]);
  return <header className="site-header"><div className="container header-inner"><Link className="logo" href="/" aria-label="DevStore, início"><span className="logo-mark"><Cpu size={19} /></span>dev<span>store</span><i>.</i></Link><SiteNavigation categories={categories} name={session?.user.name ?? null} /></div></header>;
}
