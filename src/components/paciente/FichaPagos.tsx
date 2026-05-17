"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Sesion, Pago, Precio } from "@/types";
import SaldoHero from "./SaldoHero";
import RegistrarAumentoForm from "./RegistrarAumentoForm";
import { formatMonto, formatFecha } from "@/lib/utils";

type Props = {
  pacienteId: string;
  sesiones: Sesion[];
  pagos: Pago[];
  precios: Precio[];
};

const FORMA_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export default function FichaPagos({ pacienteId, sesiones, pagos, precios }: Props) {
  const router = useRouter();
  const [showAumento, setShowAumento] = useState(false);

  const precioVigente = precios[0] ?? null;

  function onAumentoGuardado() {
    setShowAumento(false);
    router.refresh();
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <SaldoHero sesiones={sesiones} pagos={pagos} />

      {/* Precio vigente */}
      <section className="space-y-2">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Precio por sesión
        </p>

        {precioVigente ? (
          <div className="rounded-2xl border border-borde bg-surface px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[22px] font-bold text-texto">
                {formatMonto(precioVigente.monto)}
              </p>
              <p className="font-sans text-[12px] text-texto3 mt-0.5 capitalize">
                Desde {formatFecha(precioVigente.vigente_desde)}
              </p>
            </div>
            {!showAumento && (
              <button
                onClick={() => setShowAumento(true)}
                className="shrink-0 min-h-[36px] px-3 rounded-xl border border-borde bg-surface2 font-sans text-[13px] font-semibold text-texto2 active:bg-borde"
              >
                + Aumento
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-borde bg-surface px-4 py-3">
            <p className="font-sans text-[13px] text-texto3">Sin precio configurado.</p>
          </div>
        )}

        {showAumento && (
          <RegistrarAumentoForm
            pacienteId={pacienteId}
            onGuardado={onAumentoGuardado}
            onCancelar={() => setShowAumento(false)}
          />
        )}

        {/* Historial de precios anteriores */}
        {precios.length > 1 && (
          <div className="space-y-1 pt-1">
            {precios.slice(1).map((precio, i) => (
              <div key={precio.id} className="flex items-center justify-between px-1 py-1">
                <span className="font-sans text-[12px] text-texto3 capitalize">
                  Desde {formatFecha(precio.vigente_desde)}
                </span>
                <span className="font-mono text-[12px] text-texto3">
                  {formatMonto(precio.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial de pagos */}
      <section className="space-y-2">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Pagos recibidos
        </p>

        {pagos.length === 0 ? (
          <p className="font-sans text-[13px] text-texto3">Sin pagos registrados.</p>
        ) : (
          <div className="space-y-2">
            {pagos.map((pago) => (
              <div
                key={pago.id}
                className="flex items-center justify-between rounded-xl border border-borde bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-sans text-[13px] font-semibold text-texto capitalize">
                    {formatFecha(pago.fecha_pago)}
                  </p>
                  <p className="font-sans text-[11px] text-texto3 mt-0.5">
                    {FORMA_LABEL[pago.forma_pago] ?? pago.forma_pago}
                  </p>
                </div>
                <span className="font-mono text-[16px] font-bold text-verde">
                  {formatMonto(pago.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
