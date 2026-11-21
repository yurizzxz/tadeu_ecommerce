"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (result.error) { setError(true); return; }
      router.push("/entrar");
      router.refresh();
    } catch { setError(true); } finally { setPending(false); }
  }
  return <><button className="button button-outline" type="button" onClick={logout} disabled={pending}>Sair</button>{error && <p role="alert">Não foi possível sair. Tente novamente.</p>}</>;
}
