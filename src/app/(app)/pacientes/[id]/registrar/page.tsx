import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getPrecioVigente } from "@/lib/precios";
import { parseLocalDate, toDateStr, formatFecha, formatHora } from "@/lib/utils";
import type { EstadoSesion } from "@/types";
import RegistrarFlujo from "@/components/registro/RegistrarFlujo";

const DIAS = [
  "domingo", "lunes", "martes", "miercoles",
  "jueves", "viernes", "sabado",
] as const;

type SesionExistente = {
  id: string;
  estado: EstadoSesion;
  genera_cobro: boolean;
  monto: number | null;
} | null;

export default async function RegistrarSesionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { id } = await params;
  const { fecha: fechaParam } = await searchParams;

  const hoy = toDateStr(new Date());
  const fechaStr = fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : hoy;
  const fechaDate = parseLocalDate(fechaStr);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id, nombre, dias_horario")
    .eq("id", id)
    .eq("profesional_id", user.id)
    .single();

  if (!paciente) notFound();

  const diaNombre = DIAS[fechaDate.getDay()];
  const hora =
    (paciente.dias_horario as Record<string, string> | null)?.[diaNombre] ?? "00:00";

  const monto = await getPrecioVigente(supabase, id, fechaDate);

  const { data: sesionData } = await supabase
    .from("sesiones")
    .select("id, estado, genera_cobro, monto")
    .eq("paciente_id", id)
    .eq("fecha", fechaStr)
    .maybeSingle();

  const sesionExistente: SesionExistente = sesionData
    ? {
        id: sesionData.id,
        estado: sesionData.estado as EstadoSesion,
        genera_cobro: sesionData.genera_cobro,
        monto: sesionData.monto,
      }
    : null;

  return (
    <div className="mx-auto max-w-[390px] min-h-screen bg-fondo">
      <header className="sticky top-0 z-10 bg-surface border-b border-borde px-4 pt-12 pb-3 flex items-center gap-3">
        <Link
          href={`/agenda?fecha=${fechaStr}`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2 text-texto2 shrink-0"
          aria-label="Volver a la agenda"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="font-serif text-[18px] font-bold text-texto truncate leading-tight">
            {paciente.nombre}
          </h1>
          <p className="font-sans text-[12px] text-texto3 capitalize mt-0.5">
            {formatFecha(fechaStr)} · {formatHora(hora)}
          </p>
        </div>
      </header>

      <RegistrarFlujo
        pacienteId={id}
        fecha={fechaStr}
        hora={hora}
        monto={monto}
        sesionExistente={sesionExistente}
      />
    </div>
  );
}
