import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { parseLocalDate, toDateStr, formatMonto, formatHora } from "@/lib/utils";

// ── Helpers de rango (duplicados del padre para evitar import cross-route) ────

function getMondayOfWeek(ref: Date): Date {
  const d = new Date(ref);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function getSemanaRange(ref: Date): [string, string] {
  const lunes = getMondayOfWeek(ref);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return [toDateStr(lunes), toDateStr(domingo)];
}

function getMesRange(ref: Date): [string, string] {
  const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fin = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return [toDateStr(inicio), toDateStr(fin)];
}

function formatPeriodoLabel(inicio: string, fin: string, periodo: string): string {
  const i = parseLocalDate(inicio);
  const f = parseLocalDate(fin);
  if (periodo === "mensual") {
    return i.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  }
  const diaI = i.getDate();
  const diaF = f.getDate();
  const mes = i.toLocaleDateString("es-AR", { month: "long" });
  const anio = i.getFullYear();
  if (i.getMonth() === f.getMonth()) return `${diaI} al ${diaF} de ${mes} ${anio}`;
  return `${diaI} de ${mes} al ${diaF} de ${f.toLocaleDateString("es-AR", { month: "long" })} ${anio}`;
}

// ── Badge de estado ───────────────────────────────────────────────────────────

const ESTADO_META: Record<string, { label: string; cls: string }> = {
  realizada:             { label: "Asistió",     cls: "bg-verde-light text-verde border-verde-mid" },
  falta_con_aviso:       { label: "Falta (avisó)", cls: "bg-rojo-light text-rojo border-[#e8b0b0]" },
  falta_sin_aviso:       { label: "Falta",        cls: "bg-rojo-light text-rojo border-[#e8b0b0]" },
  cancelada_profesional: { label: "Cancelada",    cls: "bg-indigo-light text-indigo border-indigo-borde" },
  vacaciones:            { label: "Vacaciones",   cls: "bg-surface2 text-texto3 border-borde" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResumenPacientePage({
  params,
  searchParams,
}: {
  params: Promise<{ pacienteId: string }>;
  searchParams: Promise<{ periodo?: string; ref?: string }>;
}) {
  const { pacienteId } = await params;
  const { periodo: periodoParam, ref: refParam } = await searchParams;
  const periodo = periodoParam === "mensual" ? "mensual" : "semanal";
  const hoy = new Date();
  const refStr = refParam && /^\d{4}-\d{2}-\d{2}$/.test(refParam) ? refParam : toDateStr(hoy);
  const refDate = parseLocalDate(refStr);

  const [inicio, fin] = periodo === "mensual" ? getMesRange(refDate) : getSemanaRange(refDate);
  const label = formatPeriodoLabel(inicio, fin, periodo);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id, nombre")
    .eq("id", pacienteId)
    .eq("profesional_id", user.id)
    .single();

  if (!paciente) notFound();

  const { data: sesiones } = await supabase
    .from("sesiones")
    .select("*")
    .eq("paciente_id", pacienteId)
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  const ss = sesiones ?? [];
  const sesionIds = ss.map((s) => s.id);

  const { data: pagos } = sesionIds.length > 0
    ? await supabase.from("pagos").select("*").in("sesion_id", sesionIds)
    : { data: [] };

  const pp = pagos ?? [];
  const pagoPorSesion = new Map(pp.map((p) => [p.sesion_id, p]));

  // Métricas del período para este paciente
  const facturado = ss.reduce((acc, s) => acc + (s.genera_cobro && s.monto ? Number(s.monto) : 0), 0);
  const cobrado   = pp.reduce((acc, p) => acc + Number(p.monto), 0);
  const pendiente = facturado - cobrado;

  const backHref = `/resumen?periodo=${periodo}&ref=${refStr}`;

  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface border-b border-borde">
        <div className="px-4 pt-12 pb-2 flex items-center gap-3">
          <Link
            href={backHref}
            className="flex items-center justify-center min-h-[36px] min-w-[36px] rounded-xl bg-surface2 border border-borde text-texto2 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="font-serif text-[20px] font-bold text-texto truncate">{paciente.nombre}</h1>
            <p className="font-sans text-[12px] text-texto3 capitalize">{label}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">

        {/* Resumen del período */}
        <section className="space-y-2">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">Resumen del período</p>
          <div className="rounded-2xl border border-borde bg-surface divide-y divide-borde">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-sans text-[14px] text-texto2">Facturado</span>
              <span className="font-mono text-[15px] font-bold text-texto">{formatMonto(facturado)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-sans text-[14px] text-texto2">Cobrado</span>
              <span className="font-mono text-[15px] font-bold text-verde">{formatMonto(cobrado)}</span>
            </div>
            {pendiente > 0 && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-sans text-[14px] text-texto2">Pendiente</span>
                <span className="font-mono text-[15px] font-bold text-naranja">{formatMonto(pendiente)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Historial de sesiones */}
        {ss.length > 0 ? (
          <section className="space-y-2">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">Sesiones</p>
            <div className="rounded-2xl border border-borde bg-surface divide-y divide-borde overflow-hidden">
              {ss.map((s) => {
                const pago = pagoPorSesion.get(s.id);
                const esMeta = ESTADO_META[s.estado] ?? { label: s.estado, cls: "bg-surface2 text-texto3 border-borde" };
                const fecha = parseLocalDate(s.fecha);
                const diaLabel = fecha.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

                let pagoLabel: string;
                let pagoColor: string;
                if (!s.genera_cobro) {
                  pagoLabel = "Sin cargo";
                  pagoColor = "text-texto3";
                } else if (pago) {
                  pagoLabel = `${formatMonto(Number(pago.monto))} · ${pago.forma_pago === "efectivo" ? "Efectivo" : "Transferencia"}`;
                  pagoColor = "text-verde";
                } else if (s.monto) {
                  pagoLabel = `Adeuda ${formatMonto(Number(s.monto))}`;
                  pagoColor = "text-naranja";
                } else {
                  pagoLabel = "Sin cargo";
                  pagoColor = "text-texto3";
                }

                return (
                  <div key={s.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[12px] text-texto3 shrink-0">{formatHora(s.hora)}</span>
                        <span className="font-sans text-[13px] font-semibold text-texto capitalize truncate">{diaLabel}</span>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-semibold ${esMeta.cls}`}>
                        {esMeta.label}
                      </span>
                    </div>
                    <p className={`font-sans text-[12px] ${pagoColor}`}>{pagoLabel}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <p className="font-sans text-[14px] text-texto3 text-center py-6">
            Sin sesiones registradas en este período.
          </p>
        )}

      </div>
    </div>
  );
}
