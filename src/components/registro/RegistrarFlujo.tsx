"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarSesion } from "@/app/(app)/pacientes/actions";
import type { EstadoSesion, FormaPago } from "@/types";
import { formatMonto } from "@/lib/utils";
import Badge from "@/components/shared/Badge";

// ── Tipos ────────────────────────────────────────────────────────────────────

type SesionExistente = {
  id: string;
  estado: EstadoSesion;
  genera_cobro: boolean;
  monto: number | null;
} | null;

type FlowStep = "existente" | "asistio" | "abono" | "falta" | "cierre";

function buildCierreCancel(): CierreData {
  return { tipo: "ok", titulo: "Sesión cancelada", descripcion: "Cancelación propia registrada sin cargo." };
}

type CierreData = {
  titulo: string;
  descripcion: string;
  tipo: "ok" | "debe" | "alerta";
};

type Props = {
  pacienteId: string;
  fecha: string;
  hora: string;
  monto: number;
  sesionExistente: SesionExistente;
};

// ── Helpers de UI ────────────────────────────────────────────────────────────

function BigButton({
  onClick,
  variant = "primary",
  children,
  disabled,
}: {
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const styles = {
    primary:   "bg-verde text-white active:bg-[#3a7060]",
    secondary: "bg-surface border border-borde text-texto active:bg-surface2",
    danger:    "bg-rojo-light border border-[#e8b0b0] text-rojo active:bg-[#f5d5d5]",
    ghost:     "text-texto2 active:bg-surface2",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[68px] rounded-2xl font-sans text-[16px] font-bold transition-colors flex items-center justify-center disabled:opacity-40 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-h-[48px] rounded-xl font-sans text-[14px] font-semibold transition-colors border ${
        active
          ? "bg-verde text-white border-verde"
          : "bg-surface border-borde text-texto2"
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3 mb-3">
      {children}
    </p>
  );
}

function buildCierre(params: {
  estado: EstadoSesion;
  generaCobro: boolean;
  abono: boolean;
  formaPago?: FormaPago;
  monto: number;
}): CierreData {
  const montoStr = formatMonto(params.monto);

  if (params.estado === "realizada" && params.abono && params.formaPago) {
    return {
      tipo: "ok",
      titulo: "Sesión registrada",
      descripcion: `Cobrado ${montoStr} en ${params.formaPago === "efectivo" ? "efectivo" : "transferencia"}.`,
    };
  }
  if (params.estado === "realizada" && !params.abono) {
    return {
      tipo: "debe",
      titulo: "Sesión registrada",
      descripcion: `Asistió y queda adeudando ${montoStr}.`,
    };
  }
  if (!params.generaCobro) {
    return {
      tipo: "ok",
      titulo: "Falta registrada",
      descripcion: `Sin cargo para esta sesión.`,
    };
  }
  return {
    tipo: "alerta",
    titulo: "Falta registrada",
    descripcion: `Queda adeudando ${montoStr}.`,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RegistrarFlujo({
  pacienteId,
  fecha,
  hora,
  monto,
  sesionExistente,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<FlowStep>(sesionExistente ? "existente" : "asistio");
  const [aviso, setAviso] = useState<boolean | null>(null);
  const [cierre, setCierre] = useState<CierreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function doSubmit(params: {
    estado: EstadoSesion;
    generaCobro: boolean;
    abono: boolean;
    formaPago?: FormaPago;
  }) {
    setError(null);
    startTransition(async () => {
      const result = await registrarSesion({ pacienteId, fecha, hora, monto, ...params });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCierre(buildCierre({ ...params, monto }));
      setStep("cierre");
    });
  }

  // ── Step: existente ────────────────────────────────────────────────────────
  if (step === "existente" && sesionExistente) {
    return (
      <div className="px-4 py-8 space-y-6">
        <div className="rounded-2xl border border-borde bg-surface p-5 space-y-3">
          <SectionTitle>Estado actual</SectionTitle>
          <Badge variant={sesionExistente.estado} />
          {sesionExistente.genera_cobro && sesionExistente.monto != null && (
            <p className="font-mono text-[15px] font-bold text-texto">
              {formatMonto(sesionExistente.monto)}
            </p>
          )}
        </div>

        <BigButton variant="secondary" onClick={() => { setAviso(null); setStep("asistio"); }}>
          Modificar registro
        </BigButton>
        <BigButton variant="ghost" onClick={() => router.push(`/agenda?fecha=${fecha}`)}>
          Volver a la agenda
        </BigButton>
      </div>
    );
  }

  // ── Step: ¿Asistió? ────────────────────────────────────────────────────────
  if (step === "asistio") {
    return (
      <div className="px-4 py-8 space-y-4">
        <SectionTitle>¿Qué pasó con esta sesión?</SectionTitle>
        {monto > 0 && (
          <p className="font-mono text-[20px] font-bold text-texto">{formatMonto(monto)}</p>
        )}
        <div className="space-y-3 pt-2">
          <BigButton onClick={() => setStep("abono")} disabled={isPending}>
            Sí, asistió
          </BigButton>
          <BigButton variant="danger" onClick={() => setStep("falta")} disabled={isPending}>
            No asistió
          </BigButton>
          <BigButton
            variant="secondary"
            onClick={() => {
              startTransition(async () => {
                const result = await registrarSesion({
                  pacienteId, fecha, hora, monto,
                  estado: "cancelada_profesional", generaCobro: false, abono: false,
                });
                if (!result.ok) { setError(result.error); return; }
                setCierre(buildCierreCancel());
                setStep("cierre");
              });
            }}
            disabled={isPending}
          >
            {isPending ? "Guardando…" : "Cancelé yo esta sesión"}
          </BigButton>
        </div>
        {error && (
          <div className="rounded-xl border border-naranja-borde bg-naranja-light px-4 py-3">
            <p className="font-sans text-[13px] text-naranja">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Step: ¿Cómo abonó? ────────────────────────────────────────────────────
  if (step === "abono") {
    return (
      <div className="px-4 py-8 space-y-4">
        <SectionTitle>¿Cómo abonó?</SectionTitle>
        <div className="space-y-3">
          <BigButton
            onClick={() => doSubmit({ estado: "realizada", generaCobro: true, abono: true, formaPago: "efectivo" })}
            disabled={isPending}
          >
            {isPending ? "Guardando…" : "Efectivo"}
          </BigButton>
          <BigButton
            variant="secondary"
            onClick={() => doSubmit({ estado: "realizada", generaCobro: true, abono: true, formaPago: "transferencia" })}
            disabled={isPending}
          >
            {isPending ? "Guardando…" : "Transferencia"}
          </BigButton>
          <BigButton
            variant="ghost"
            onClick={() => doSubmit({ estado: "realizada", generaCobro: true, abono: false })}
            disabled={isPending}
          >
            {isPending ? "Guardando…" : `No pagó hoy — queda adeudando ${monto > 0 ? formatMonto(monto) : ""}`}
          </BigButton>
        </div>
        {error && (
          <div className="rounded-xl border border-naranja-borde bg-naranja-light px-4 py-3">
            <p className="font-sans text-[13px] text-naranja">{error}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setStep("asistio")}
          className="w-full py-2 font-sans text-[13px] text-texto3"
        >
          ← Atrás
        </button>
      </div>
    );
  }

  // ── Step: Falta ────────────────────────────────────────────────────────────
  if (step === "falta") {
    return (
      <div className="px-4 py-8 space-y-6">
        <div className="space-y-3">
          <SectionTitle>¿Avisó con anticipación?</SectionTitle>
          <div className="flex gap-2">
            <ToggleButton active={aviso === true} onClick={() => setAviso(true)}>
              Sí, avisó
            </ToggleButton>
            <ToggleButton active={aviso === false} onClick={() => setAviso(false)}>
              No avisó
            </ToggleButton>
          </div>
        </div>

        {aviso !== null && (
          <div className="space-y-3">
            <SectionTitle>¿Cobrás esta sesión?</SectionTitle>
            <BigButton
              variant="secondary"
              onClick={() =>
                doSubmit({
                  estado: aviso ? "falta_con_aviso" : "falta_sin_aviso",
                  generaCobro: true,
                  abono: false,
                })
              }
              disabled={isPending}
            >
              {isPending ? "Guardando…" : `Sí, cobrar${monto > 0 ? ` ${formatMonto(monto)}` : ""}`}
            </BigButton>
            <BigButton
              variant="ghost"
              onClick={() =>
                doSubmit({
                  estado: aviso ? "falta_con_aviso" : "falta_sin_aviso",
                  generaCobro: false,
                  abono: false,
                })
              }
              disabled={isPending}
            >
              {isPending ? "Guardando…" : "No, sin cargo"}
            </BigButton>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-naranja-borde bg-naranja-light px-4 py-3">
            <p className="font-sans text-[13px] text-naranja">{error}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setStep("asistio")}
          className="w-full py-2 font-sans text-[13px] text-texto3"
        >
          ← Atrás
        </button>
      </div>
    );
  }

  // ── Step: Cierre ───────────────────────────────────────────────────────────
  if (step === "cierre" && cierre) {
    const colorMap = {
      ok:     { bg: "bg-verde-light", border: "border-verde-mid", icon: "text-verde" },
      debe:   { bg: "bg-naranja-light", border: "border-naranja-borde", icon: "text-naranja" },
      alerta: { bg: "bg-naranja-light", border: "border-naranja-borde", icon: "text-naranja" },
    };
    const colors = colorMap[cierre.tipo];

    const Icon = cierre.tipo === "ok"
      ? () => (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )
      : () => (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        );

    return (
      <div className="px-4 py-8 space-y-6">
        <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 flex flex-col items-center text-center gap-3`}>
          <span className={colors.icon}>
            <Icon />
          </span>
          <div>
            <p className="font-sans text-[17px] font-bold text-texto">{cierre.titulo}</p>
            <p className="font-sans text-[14px] text-texto2 mt-1">{cierre.descripcion}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/agenda?fecha=${fecha}`)}
          className="w-full min-h-[56px] rounded-2xl bg-verde font-sans text-[16px] font-bold text-white active:bg-[#3a7060] transition-colors"
        >
          Volver a la agenda
        </button>
      </div>
    );
  }

  return null;
}
