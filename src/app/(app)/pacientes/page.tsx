import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

const DIA_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIA_LABEL: Record<string, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom",
};

function getInitials(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDias(diasHorario: Record<string, string> | null): string {
  if (!diasHorario) return "Sin horario";
  const dias = DIA_ORDER.filter((d) => d in diasHorario);
  if (dias.length === 0) return "Sin horario";
  return dias.map((d) => DIA_LABEL[d]).join(" · ");
}

export default async function PacientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("id, nombre, dias_horario")
    .eq("profesional_id", user.id)
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface px-4 pt-12 pb-3 border-b border-borde flex items-center justify-between">
        <h1 className="font-serif text-[20px] font-bold text-texto">Pacientes</h1>
        <Link
          href="/pacientes/nuevo"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-verde"
          aria-label="Agregar paciente"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </Link>
      </header>

      <div className="px-4 py-4 space-y-2">
        {!pacientes || pacientes.length === 0 ? (
          <div className="text-center mt-12 space-y-3">
            <p className="font-sans text-[14px] text-texto3">
              Todavía no tenés pacientes activos.
            </p>
            <Link
              href="/pacientes/nuevo"
              className="inline-flex items-center gap-1.5 font-sans text-[14px] font-semibold text-verde"
            >
              <span>+</span> Agregar el primero
            </Link>
          </div>
        ) : (
          pacientes.map((p) => (
            <Link
              key={p.id}
              href={`/pacientes/${p.id}`}
              className="flex items-center gap-3 rounded-2xl border border-borde bg-surface px-4 py-3 min-h-[64px] active:bg-surface2 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verde-mid">
                <span className="font-sans text-[13px] font-bold text-verde">
                  {getInitials(p.nombre)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-sans text-[14px] font-semibold text-texto truncate leading-tight">
                  {p.nombre}
                </p>
                <p className="font-sans text-[12px] text-texto3 mt-0.5">
                  {formatDias(p.dias_horario as Record<string, string> | null)}
                </p>
              </div>

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="shrink-0 text-texto3"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
