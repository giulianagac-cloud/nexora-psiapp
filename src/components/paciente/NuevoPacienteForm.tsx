"use client";

import { useActionState, useState } from "react";
import { crearPaciente } from "@/app/(app)/pacientes/actions";
import Button from "@/components/shared/Button";

const DIAS_CONFIG = [
  { key: "lunes",     label: "Lu" },
  { key: "martes",    label: "Ma" },
  { key: "miercoles", label: "Mi" },
  { key: "jueves",    label: "Ju" },
  { key: "viernes",   label: "Vi" },
  { key: "sabado",    label: "Sá" },
  { key: "domingo",   label: "Do" },
];

const DIA_NOMBRE: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};

const INPUT = "w-full rounded-xl border border-borde bg-surface px-4 font-sans text-[15px] text-texto placeholder:text-texto3 focus:border-verde focus:outline-none focus:ring-2 focus:ring-verde/20 min-h-[44px]";

type OptionCardProps = {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
};

function OptionCard({ selected, onClick, label, description }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors min-h-[44px] ${
        selected
          ? "border-verde bg-verde-light"
          : "border-borde bg-surface"
      }`}
    >
      <p className={`font-sans text-[13px] font-semibold ${selected ? "text-verde" : "text-texto"}`}>
        {label}
      </p>
      {description && (
        <p className="font-sans text-[11px] text-texto3 mt-0.5 leading-tight">{description}</p>
      )}
    </button>
  );
}

export default function NuevoPacienteForm() {
  const [state, action, isPending] = useActionState(crearPaciente, { error: null });
  const [diasHorario, setDiasHorario] = useState<Record<string, string>>({});
  const [modalidad, setModalidad] = useState<"por_sesion" | "mensual" | "">("");
  const [politica, setPolitica] = useState<"cobra_siempre" | "no_cobra_si_avisa" | "por_caso" | "">("");

  function toggleDia(key: string) {
    setDiasHorario((prev) => {
      const next = { ...prev };
      if (key in next) delete next[key];
      else next[key] = "09:00";
      return next;
    });
  }

  const diasActivos = DIAS_CONFIG.filter(({ key }) => key in diasHorario);

  return (
    <form action={action} className="px-4 py-6 space-y-7 pb-10">
      <input type="hidden" name="dias_horario" value={JSON.stringify(diasHorario)} />
      <input type="hidden" name="modalidad_pago" value={modalidad} />
      <input type="hidden" name="politica_ausencia" value={politica} />

      {/* Datos básicos */}
      <section className="space-y-4">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Datos básicos
        </h2>

        <div className="space-y-1.5">
          <label className="block font-sans text-[13px] font-semibold text-texto2">
            Nombre completo *
          </label>
          <input name="nombre" required placeholder="Ej: María González" className={INPUT} />
        </div>

        <div className="space-y-1.5">
          <label className="block font-sans text-[13px] font-semibold text-texto2">
            WhatsApp
          </label>
          <input
            name="whatsapp"
            type="tel"
            placeholder="+54 9 11 1234 5678"
            className={INPUT}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-sans text-[13px] font-semibold text-texto2">
            Fecha de inicio
          </label>
          <input name="fecha_inicio" type="date" className={INPUT} />
        </div>
      </section>

      {/* Días y horarios */}
      <section className="space-y-3">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Días y horarios
        </h2>

        <div className="flex gap-1.5">
          {DIAS_CONFIG.map(({ key, label }) => {
            const active = key in diasHorario;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleDia(key)}
                className={`flex-1 min-h-[40px] rounded-xl font-sans text-[12px] font-bold transition-colors ${
                  active
                    ? "bg-verde text-white"
                    : "bg-surface2 text-texto3 border border-borde"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {diasActivos.length > 0 && (
          <div className="space-y-2 pt-1">
            {diasActivos.map(({ key }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 font-sans text-[13px] font-semibold text-texto2 shrink-0">
                  {DIA_NOMBRE[key]}
                </span>
                <input
                  type="time"
                  value={diasHorario[key]}
                  onChange={(e) =>
                    setDiasHorario((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className={`${INPUT} flex-1`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modalidad de pago */}
      <section className="space-y-3">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Modalidad de pago
        </h2>
        <div className="flex gap-2">
          <OptionCard
            selected={modalidad === "por_sesion"}
            onClick={() => setModalidad("por_sesion")}
            label="Por sesión"
            description="Cobra cada sesión por separado"
          />
          <OptionCard
            selected={modalidad === "mensual"}
            onClick={() => setModalidad("mensual")}
            label="Mensual"
            description="Cierra cuentas a fin de mes"
          />
        </div>
      </section>

      {/* Política de ausencia */}
      <section className="space-y-3">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Política de ausencia
        </h2>
        <div className="flex gap-2">
          <OptionCard
            selected={politica === "cobra_siempre"}
            onClick={() => setPolitica("cobra_siempre")}
            label="Cobra siempre"
          />
          <OptionCard
            selected={politica === "no_cobra_si_avisa"}
            onClick={() => setPolitica("no_cobra_si_avisa")}
            label="No cobra si avisó"
          />
          <OptionCard
            selected={politica === "por_caso"}
            onClick={() => setPolitica("por_caso")}
            label="Por caso"
          />
        </div>
      </section>

      {/* Precio inicial */}
      <section className="space-y-3">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
          Precio por sesión
        </h2>
        <div className="space-y-1.5">
          <label className="block font-sans text-[13px] font-semibold text-texto2">
            Monto inicial (ARS)
          </label>
          <input
            name="monto_inicial"
            type="number"
            min="0"
            step="100"
            placeholder="Ej: 15000"
            className={INPUT}
          />
        </div>
      </section>

      {/* Observaciones */}
      <section className="space-y-1.5">
        <label className="block font-sans text-[13px] font-semibold text-texto2">
          Observaciones
        </label>
        <textarea
          name="observaciones"
          rows={3}
          placeholder="Notas sobre el paciente, contexto, etc."
          className={`${INPUT} min-h-[80px] resize-none py-3 h-auto`}
        />
      </section>

      {state.error && (
        <div className="rounded-xl border border-naranja-borde bg-naranja-light px-4 py-3">
          <p className="font-sans text-[13px] text-naranja">{state.error}</p>
        </div>
      )}

      <Button type="submit" fullWidth disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar paciente"}
      </Button>
    </form>
  );
}
