"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Button from "@/components/shared/Button";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "Ya existe una cuenta con ese email."
        : "No se pudo crear la cuenta. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/agenda");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo px-6">
      <div className="w-full max-w-[390px]">
        <div className="mb-8">
          <h1 className="font-serif text-[32px] font-bold text-texto leading-tight">
            Crear cuenta
          </h1>
          <p className="font-sans text-[14px] text-texto2 mt-1">
            Gestión de pacientes y sesiones
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-sans text-[13px] font-semibold text-texto2">
              Nombre
            </label>
            <input
              type="text"
              autoComplete="name"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="
                w-full rounded-xl border border-borde bg-surface px-4
                font-sans text-[15px] text-texto placeholder:text-texto3
                focus:border-verde focus:outline-none focus:ring-2 focus:ring-verde/20
                min-h-[44px]
              "
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-sans text-[13px] font-semibold text-texto2">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="
                w-full rounded-xl border border-borde bg-surface px-4
                font-sans text-[15px] text-texto placeholder:text-texto3
                focus:border-verde focus:outline-none focus:ring-2 focus:ring-verde/20
                min-h-[44px]
              "
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-sans text-[13px] font-semibold text-texto2">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="
                w-full rounded-xl border border-borde bg-surface px-4
                font-sans text-[15px] text-texto placeholder:text-texto3
                focus:border-verde focus:outline-none focus:ring-2 focus:ring-verde/20
                min-h-[44px]
              "
            />
          </div>

          {error && (
            <div className="rounded-xl border border-naranja-borde bg-naranja-light px-4 py-3">
              <p className="font-sans text-[13px] text-naranja">{error}</p>
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading} className="mt-2">
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>

        <p className="font-sans text-[13px] text-texto3 text-center mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-verde font-semibold">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
