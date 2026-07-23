"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "persona" | "empresa";
type Mode = "login" | "register";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = (params.get("role") as Role) ?? "persona";
  const nextParam =
    params.get("next") ?? (roleParam === "empresa" ? "/panel" : "/");

  const [role, setRole] = useState<Role>(roleParam);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const dest = role === "empresa" ? "/panel" : nextParam;

  async function withGoogle() {
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(dest)}`,
      },
    });
    if (error) setErr(error.message);
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    const supabase = createClient();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(dest);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { tipo: role },
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(dest)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(dest);
          router.refresh();
        } else {
          setMsg("Te enviamos un email para confirmar la cuenta.");
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto" }}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Acceso</h1>
      <p className="muted" style={{ marginBottom: 22 }}>
        ¿Quién sos?
      </p>

      <div className="row" style={{ marginBottom: 22, gap: 10 }}>
        <button
          type="button"
          className={`btn ${role === "persona" ? "btn--primary" : "btn--ghost"}`}
          style={{ flex: 1, flexDirection: "column", alignItems: "flex-start", padding: 14 }}
          onClick={() => setRole("persona")}
        >
          <span style={{ fontSize: 18 }}>🙋 Soy persona</span>
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>
            Guardá fichas y no las pierdas nunca.
          </span>
        </button>
        <button
          type="button"
          className={`btn ${role === "empresa" ? "btn--primary" : "btn--ghost"}`}
          style={{ flex: 1, flexDirection: "column", alignItems: "flex-start", padding: 14 }}
          onClick={() => setRole("empresa")}
        >
          <span style={{ fontSize: 18 }}>🏢 Soy empresa</span>
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>
            Cargá tu ficha, tu foto y tu QR.
          </span>
        </button>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div className="row" style={{ marginBottom: 18, gap: 6 }}>
          <button
            className={`btn ${mode === "login" ? "btn--primary" : "btn--ghost"}`}
            style={{ flex: 1 }}
            onClick={() => setMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={`btn ${mode === "register" ? "btn--primary" : "btn--ghost"}`}
            style={{ flex: 1 }}
            onClick={() => setMode("register")}
          >
            Registrarme
          </button>
        </div>

        <button className="btn btn--ghost btn--block" onClick={withGoogle} type="button">
          Continuar con Google
        </button>

        <div
          style={{
            textAlign: "center",
            margin: "16px 0",
            color: "var(--ink-40)",
            fontSize: 13,
          }}
        >
          o con tu email
        </div>

        <form onSubmit={withEmail}>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          {err && (
            <p style={{ color: "var(--terracota)", fontSize: 13, marginBottom: 12 }}>
              {err}
            </p>
          )}
          {msg && (
            <p style={{ color: "var(--verde)", fontSize: 13, marginBottom: 12 }}>
              {msg}
            </p>
          )}
          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy
              ? "..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
