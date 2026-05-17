"use client";

import { useState, useTransition } from "react";
import { registrarAumento } from "@/app/(app)/pacientes/actions";

type Props = {
  pacienteId: string;
  onGuardado: () => void;
  onCancelar: () => void;
};

export default function RegistrarAumentoForm({ pacienteId, onGuardado, onCancelar }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const monto = parseFloat(fd.get("monto") as string);
    const vigenteDesde = fd.get("vigente_desde") as string;

    setError(null);
    startTransition(async () => {
      const result = await registrarAumento({ pacienteId, monto, vigenteDesde });
      if (result.error) setError(result.error);
      else onGuardado();
    });
  }

  const inputCls =
    "w-full rounded-xl border border-verde-mid bg-surface px-4 font-sans text-[15px] text-texto min-h-[44px] focus:outline-none focus:ring-2 focus:ring-verde/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-verde-mid bg-verde-light p-4 space-y-3"
    >
      <p className="font-sans text-[13px] font-semibold text-verde">Nuevo precio</p>

      <div className="space-y-1.5">
        <label className="block font-sans text-[12px] font-semibold text-verde">
          Monto (ARS)
        </label>
        <input
          name="monto"
          type="number"
          min="0"
          step="100"
          placeholder="Ej: 20000"
          required
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block font-sans text-[12px] font-semibold text-verde">
          Vigente desde
        </label>
        <input
          name="vigente_desde"
          type="date"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className={inputCls}
        />
      </div>

      {error && <p className="font-sans text-[12px] text-naranja">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 min-h-[44px] rounded-xl border border-verde-mid bg-surface font-sans text-[14px] font-semibold text-verde"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 min-h-[44px] rounded-xl bg-verde font-sans text-[14px] font-bold text-white disabled:opacity-40 transition-colors"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
