"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export function AuthForm({ mode }: { mode: "login" | "cadastro" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    try {
      const result = mode === "cadastro"
        ? await authClient.signUp.email({ name: String(data.get("name") ?? "").trim(), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(mode === "cadastro" ? "Não foi possível criar a conta. Confira os dados informados." : "Não foi possível entrar. Confira seu e-mail e senha.");
        return;
      }
      router.push("/conta");
      router.refresh();
    } catch {
      setError("Não foi possível concluir a operação. Tente novamente.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-page container">
      <h1>{mode === "cadastro" ? "Criar conta" : "Entrar"}</h1>
      <form method="post" onSubmit={submit}>
        {mode === "cadastro" && <label>Nome<input name="name" autoComplete="name" required /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
        <label>Senha<input name="password" type="password" autoComplete={mode === "cadastro" ? "new-password" : "current-password"} minLength={8} maxLength={128} required /></label>
        {error && <p role="alert">{error}</p>}
        <button className="button button-primary" disabled={pending} type="submit">{pending ? "Aguarde..." : mode === "cadastro" ? "Criar conta" : "Entrar"}</button>
      </form>
      <Link href={mode === "cadastro" ? "/entrar" : "/cadastro"}>{mode === "cadastro" ? "Já tenho conta" : "Criar conta"}</Link>
    </main>
  );
}
