"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/app/lib/api";

export default function LoginForm() {
  const router = useRouter();

  const userId = useId();
  const passId = useId();
  const msgId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const res = await apiPost("/api/auth/login", {
        UsernameOrEmail: username,
        Password: password,
        RememberMe: true,
      });

      // uppdatera header-menyn direkt
      window.dispatchEvent(new Event("auth-changed"));

      // redirect home + revalidate server stuff
      router.replace("/");
      router.refresh();

      setMsg(`Logged in as ${res?.username ?? username}`);
    } catch (err: any) {
      setMsg(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-busy={busy}
      aria-describedby={msg ? msgId : undefined}
      style={{ display: "grid", gap: 12, maxWidth: 360 }}
    >
      <fieldset
        disabled={busy}
        style={{
          border: "0",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: 12,
        }}
      >
        <legend style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
          Log in
        </legend>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor={userId}>Email or Username</label>
          <input
            id={userId}
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            inputMode="email"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor={passId}>Password</label>
          <input
            id={passId}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: 12,
            borderRadius: 8,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Logging in…" : "Log in"}
        </button>
      </fieldset>

      {msg && (
        <p
          id={msgId}
          role="alert"
          aria-live="polite"
          style={{ margin: 0 }}
        >
          {msg}
        </p>
      )}
    </form>
  );
}
