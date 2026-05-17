"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Paciente } from "@/types";
import { desactivarPaciente } from "@/app/(app)/pacientes/actions";

const DIA_ORDEN = [
  "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo",
];
const DIA_LABEL: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};
const MODALIDAD_LABEL: Record<string, string> = {
  por_sesion: "Por sesión",
  mensual: "Mensual",
};
const POLITICA_LABEL: Record<string, string> = {
  cobra_siempre: "Cobra siempre",
  no_cobra_si_avisa: "No cobra si avisó",
  por_caso: "Por caso",
};

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-borde last:border-0">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
        {label}
      </p>
      <p className="font-sans text-[14px] text-texto mt-0.5">{value}</p>
    </div>
  );
}

type Props = { paciente: Paciente };

export default function FichaInfo({ paciente }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmar, setConfirmar] = useState(false);

  const diasHorario = paciente.dias_horario as Record<string, string> | null;
  const diasStr = diasHorario
    ? DIA_ORDEN.filter((d) => d in diasHorario)
        .map((d) => `${DIA_LABEL[d]} ${diasHorario[d]}`)
        .join(", ")
    : null;

  function handleDesactivar() {
    startTransition(async () => {
      await desactivarPaciente(paciente.id);
      router.push("/pacientes");
    });
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="rounded-2xl border border-borde bg-surface px-4">
        <Row label="WhatsApp" value={paciente.whatsapp} />
        <Row
          label="Fecha de inicio"
          value={
            paciente.fecha_inicio
              ? new Date(paciente.fecha_inicio + "T00:00:00").toLocaleDateString("es-AR", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : null
          }
        />
        <Row label="Días y horarios" value={diasStr} />
        <Row
          label="Modalidad de pago"
          value={paciente.modalidad_pago ? MODALIDAD_LABEL[paciente.modalidad_pago] : null}
        />
        <Row
          label="Política de ausencia"
          value={paciente.politica_ausencia ? POLITICA_LABEL[paciente.politica_ausencia] : null}
        />
        <Row label="Observaciones" value={paciente.observaciones} />
      </div>

      {/* Desactivar paciente */}
      {!confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          className="w-full min-h-[44px] rounded-2xl border border-[#e8b0b0] bg-rojo-light font-sans text-[14px] font-semibold text-rojo"
        >
          Desactivar paciente
        </button>
      ) : (
        <div className="rounded-2xl border border-[#e8b0b0] bg-rojo-light p-4 space-y-3">
          <p className="font-sans text-[14px] text-rojo font-semibold text-center">
            ¿Desactivar a {paciente.nombre}?
          </p>
          <p className="font-sans text-[12px] text-rojo text-center">
            No aparecerá más en la agenda ni en la lista de pacientes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmar(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-borde bg-surface font-sans text-[14px] font-semibold text-texto2"
            >
              Cancelar
            </button>
            <button
              onClick={handleDesactivar}
              disabled={isPending}
              className="flex-1 min-h-[44px] rounded-xl bg-rojo font-sans text-[14px] font-bold text-white disabled:opacity-40"
            >
              {isPending ? "Desactivando…" : "Desactivar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
