"use client";

import { useState } from "react";
import { Auth } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await Auth.login({ UsernameOrEmail: u, Password: p, RememberMe: true });
      router.push("/favorites");
    } catch (e: any) {
      setErr("Fel användarnamn/lösen.");
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Logga in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="E-post eller användarnamn" value={u} onChange={e=>setU(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Lösenord" value={p} onChange={e=>setP(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="w-full border rounded p-2">Logga in</button>
      </form>
    </main>
  );
}
