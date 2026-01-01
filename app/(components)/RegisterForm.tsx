"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type RegisterDto = {
  email: string;
  password: string;
  username?: string;
  name?: string;
};

export default function RegisterForm() {
  const router = useRouter();

  const nameId = useId();
  const usernameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errId = useId();

  const [form, setForm] = useState<RegisterDto>({
    email: "",
    password: "",
    username: "",
    name: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onChange =
    (k: keyof RegisterDto) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        const msg =
          data?.errors?.join?.("\n") ||
          data?.message ||
          "Registreringen misslyckades.";
        setErr(msg);
        return;
      }

      // Umbraco-koden autologgar ofta in — gå till /profile
      router.replace("/profile");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Nätverksfel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 max-w-md"
      aria-busy={loading}
      aria-describedby={err ? errId : undefined}
      noValidate
    >
      <fieldset disabled={loading} className="space-y-4">
        <legend className="sr-only">Skapa konto</legend>

        {err && (
          <div
            id={errId}
            role="alert"
            aria-live="polite"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-line"
          >
            {err}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor={nameId} className="block text-sm font-medium text-zinc-700">
            Name <span className="sr-only">(valfritt)</span>
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            value={form.name}
            onChange={onChange("name")}
            autoComplete="name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={usernameId} className="block text-sm font-medium text-zinc-700">
            Username <span className="text-zinc-500">(valfritt)</span>
          </label>
          <input
            id={usernameId}
            name="username"
            type="text"
            value={form.username}
            onChange={onChange("username")}
            autoComplete="username"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="jane_doe"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={emailId} className="block text-sm font-medium text-zinc-700">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange("email")}
            autoComplete="email"
            inputMode="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={passwordId} className="block text-sm font-medium text-zinc-700">
            Password <span aria-hidden="true">*</span>
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            required
            value={form.password}
            onChange={onChange("password")}
            autoComplete="new-password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Minst 8 tecken"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-3 text-white font-medium hover:bg-zinc-800 transition disabled:opacity-60"
        >
          {loading ? "Skapar konto…" : "Skapa konto"}
        </button>

        <p className="text-sm text-zinc-600">
          Har du redan konto?{" "}
          <Link href="/login" className="font-medium underline">
            Logga in
          </Link>
        </p>
      </fieldset>
    </form>
  );
}
