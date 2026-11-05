"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) {
    return <div role="img" aria-label={`Imagem indisponível: ${alt}`}>Imagem indisponível</div>;
  }
  return <Image src={src} alt={alt} width={800} height={800} onError={() => setFailedSrc(src)} />;
}
