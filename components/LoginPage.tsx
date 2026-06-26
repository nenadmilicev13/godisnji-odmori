"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Logo from "./Logo";

export default function LoginPage() {
  const { prijava } = useStore();
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [greska, setGreska] = useState("");
  const [salje, setSalje] = useState(false);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska("");
    setSalje(true);
    const g = await prijava(email.trim(), lozinka);
    setSalje(false);
    if (g) setGreska(g);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo className="h-12 w-auto text-slate-900" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Godišnji odmori</h1>
            <p className="text-sm text-slate-500">Prijavite se da nastavite</p>
          </div>
        </div>

        <form onSubmit={posalji} className="card space-y-4 p-6">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ime.prezime@firma.rs"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Lozinka</label>
            <input
              type="password"
              className="input"
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {greska && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {greska}
            </p>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={salje}>
            {salje ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Admin (šef) je jedini koji može da odobrava zahteve.
        </p>
      </div>
    </div>
  );
}
