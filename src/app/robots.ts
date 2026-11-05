import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/entrar", "/cadastro", "/conta", "/perfil", "/carrinho", "/checkout", "/pedidos"] } };
}
