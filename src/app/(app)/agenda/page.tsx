import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { parseLocalDate, toDateStr } from "@/lib/utils";
import type { Sesion } from "@/types";
import TurnoCard from "@/components/agenda/TurnoCard";
import MiniSemana from "@/components/agenda/MiniSemana";

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
] as const;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParam } = await searchParams;

  const hoy = new Date();
  const hoySt = toDateStr(hoy);
  const fechaStr = fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : hoySt;
  const fecha = parseLocalDate(fechaStr);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const diaNombre = DIAS[fecha.getDay()];

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("id, nombre, whatsapp, dias_horario")
    .eq("profesional_id", user.id)
    .eq("activo", true)
    .not("dias_horario", "is", null);

  const pacientesHoy = (pacientes ?? []).filter(
    (p) => p.dias_horario && diaNombre in (p.dias_horario as Record<string, string>)
  );

  let sesionesHoy: Sesion[] = [];
  if (pacientesHoy.length > 0) {
    const { data } = await supabase
      .from("sesiones")
      .select("*")
      .in(
        "paciente_id",
        pacientesHoy.map((p) => p.id)
      )
      .eq("fecha", fechaStr);
    sesionesHoy = (data as Sesion[]) ?? [];
  }

  const turnos = pacientesHoy
    .map((p) => ({
      paciente: { id: p.id, nombre: p.nombre },
      hora: (p.dias_horario as Record<string, string>)[diaNombre],
      sesion: sesionesHoy.find((s) => s.paciente_id === p.id) ?? null,
    }))
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const headerFecha = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface border-b border-borde">
        <div className="px-4 pt-12 pb-2">
          <h1 className="font-serif text-[20px] font-bold text-texto capitalize">
            {headerFecha}
          </h1>
        </div>
        <MiniSemana fechaSeleccionada={fechaStr} hoy={hoySt} />
      </header>

      <div className="px-4 py-4 space-y-2">
        {turnos.length === 0 ? (
          <p className="font-sans text-[14px] text-texto3 text-center mt-10">
            No hay turnos para este día.
          </p>
        ) : (
          turnos.map((turno) => (
            <TurnoCard
              key={turno.paciente.id}
              paciente={turno.paciente}
              hora={turno.hora}
              sesion={turno.sesion}
              fecha={fechaStr}
            />
          ))
        )}
      </div>
    </div>
  );
}
