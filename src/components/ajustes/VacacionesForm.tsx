"use client";

import { useActionState } from "react";
import { registrarVacaciones } from "@/app/(app)/pacientes/actions";

const initialState = { error: null, mensaje: null };

export default function VacacionesForm() {
  const [state, action, isPending] = useActionState(registrarVacaciones, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="block font-sans text-[13px] font-semibold text-texto2">
            Desde
          </label>
          <input
            name="fecha_inicio"
            type="date"
            required
            className="w-full rounded-xl border border-borde bg-surface px-4 font-sans text-[15px] text-texto min-h-[44px] focus:border-verde focus:outline-none focus:ring-2 focus:ring-verde/20"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="block font-sans text-[13px] font-semibold text-texto2">
            Hasta
          </label>
          <input
            name="fecha_fin"
            type="date"
            required
            className="w-full rounded-xl border border-borde bg-surface px-4 font-sans text-[15px] text-texto min-h-[44px] focus:border-verde focus:outline-none focus:ring-2 focus:ring-verde/20"
          />
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-naranja-borde bg-naranja-light px-4 py-3">
          <p className="font-sans text-[13px] text-naranja">{state.error}</p>
        </div>
      )}

      {state.mensaje && !state.error && (
        <div className="rounded-xl border border-verde-mid bg-verde-light px-4 py-3">
          <p className="font-sans text-[13px] text-verde">{state.mensaje}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[44px] rounded-2xl bg-verde font-sans text-[15px] font-bold text-white disabled:opacity-40 transition-colors active:bg-[#3a7060]"
      >
        {isPending ? "Registrando…" : "Registrar ausencia"}
      </button>
    </form>
  );
}
