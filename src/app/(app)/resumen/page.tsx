import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { parseLocalDate, toDateStr, formatMonto } from "@/lib/utils";
import StatChip from "@/components/resumen/StatChip";
import BotonCompartir from "@/components/resumen/BotonCompartir";

// ── Helpers de rango ──────────────────────────────────────────────────────────

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

function shiftRef(refStr: string, periodo: string, direction: number): string {
  const d = parseLocalDate(refStr);
  if (periodo === "mensual") d.setMonth(d.getMonth() + direction);
  else d.setDate(d.getDate() + direction * 7);
  return toDateStr(d);
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

// ── Texto para compartir ──────────────────────────────────────────────────────

type PacienteResumen = { id: string; nombre: string; facturado: number; cobrado: number };

type ResumenData = {
  periodo: string;
  label: string;
  realizadas: number;
  faltasConAviso: number;
  faltasSinAviso: number;
  canceladas: number;
  facturado: number;
  cobrado: number;
  efectivo: number;
  transferencia: number;
  porPaciente: PacienteResumen[];
};

function generarTexto(d: ResumenData): string {
  const pendiente = d.facturado - d.cobrado;
  const lines: string[] = [];
  lines.push(d.periodo === "mensual" ? `*Resumen - ${d.label}*` : `*Resumen semanal - ${d.label}*`);
  lines.push("");
  lines.push(`Sesiones realizadas: ${d.realizadas}`);
  if (d.faltasConAviso > 0) lines.push(`Ausencias (avisaron): ${d.faltasConAviso}`);
  if (d.faltasSinAviso > 0) lines.push(`Ausencias (sin aviso): ${d.faltasSinAviso}`);
  if (d.canceladas > 0) lines.push(`Canceladas: ${d.canceladas}`);
  lines.push("");
  lines.push(`Facturado: ${formatMonto(d.facturado)}`);
  lines.push(`Cobrado: ${formatMonto(d.cobrado)}`);
  if (pendiente > 0) lines.push(`Pendiente: ${formatMonto(pendiente)}`);
  if (d.porPaciente.length > 0) {
    lines.push("");
    lines.push("*Por paciente:*");
    for (const p of d.porPaciente) {
      const debe = p.facturado - p.cobrado;
      const estado = debe <= 0
        ? `${formatMonto(p.cobrado)} cobrado`
        : `${formatMonto(p.cobrado)} cobrado · debe ${formatMonto(debe)}`;
      lines.push(`- ${p.nombre}: ${estado}`);
    }
    if (d.periodo === "mensual") {
      lines.push("");
      lines.push(`Efectivo: ${formatMonto(d.efectivo)}`);
      lines.push(`Transferencia: ${formatMonto(d.transferencia)}`);
    }
  }
  return lines.join("\n");
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; ref?: string }>;
}) {
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

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("id, nombre")
    .eq("profesional_id", user.id);

  const pacienteIds = (pacientes ?? []).map((p) => p.id);
  const nombrePorId = Object.fromEntries((pacientes ?? []).map((p) => [p.id, p.nombre]));

  const [{ data: sesiones }, { data: pagos }] = await Promise.all([
    pacienteIds.length > 0
      ? supabase.from("sesiones").select("*").in("paciente_id", pacienteIds).gte("fecha", inicio).lte("fecha", fin)
      : { data: [] },
    pacienteIds.length > 0
      ? supabase.from("pagos").select("*").in("paciente_id", pacienteIds).gte("fecha_pago", inicio).lte("fecha_pago", fin)
      : { data: [] },
  ]);

  const ss = sesiones ?? [];
  const pp = pagos ?? [];

  // Métricas globales
  const realizadas     = ss.filter((s) => s.estado === "realizada").length;
  const faltasConAviso = ss.filter((s) => s.estado === "falta_con_aviso").length;
  const faltasSinAviso = ss.filter((s) => s.estado === "falta_sin_aviso").length;
  const canceladas     = ss.filter((s) => s.estado === "cancelada_profesional").length;
  const facturado      = ss.reduce((acc, s) => acc + (s.genera_cobro && s.monto ? Number(s.monto) : 0), 0);
  const cobrado        = pp.reduce((acc, p) => acc + Number(p.monto), 0);
  const efectivo       = pp.filter((p) => p.forma_pago === "efectivo").reduce((acc, p) => acc + Number(p.monto), 0);
  const transferencia  = pp.filter((p) => p.forma_pago === "transferencia").reduce((acc, p) => acc + Number(p.monto), 0);
  const pendiente      = facturado - cobrado;

  // Por paciente — todos los que tuvieron alguna sesión en el período
  const porPacienteMap = new Map<string, { facturado: number; cobrado: number }>();
  for (const s of ss) {
    const cur = porPacienteMap.get(s.paciente_id) ?? { facturado: 0, cobrado: 0 };
    if (s.genera_cobro && s.monto) cur.facturado += Number(s.monto);
    porPacienteMap.set(s.paciente_id, cur);
  }
  for (const p of pp) {
    const cur = porPacienteMap.get(p.paciente_id) ?? { facturado: 0, cobrado: 0 };
    cur.cobrado += Number(p.monto);
    porPacienteMap.set(p.paciente_id, cur);
  }
  const porPaciente: PacienteResumen[] = [...porPacienteMap.entries()]
    .map(([id, v]) => ({ id, nombre: nombrePorId[id] ?? "Paciente", ...v }))
    .sort((a, b) => b.facturado - a.facturado);

  const resumenData: ResumenData = {
    periodo, label, realizadas, faltasConAviso, faltasSinAviso,
    canceladas, facturado, cobrado, efectivo, transferencia, porPaciente,
  };

  const prevRef = shiftRef(refStr, periodo, -1);
  const nextRef = shiftRef(refStr, periodo, 1);

  const Chevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="shrink-0 text-texto3">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface border-b border-borde">
        <div className="px-4 pt-12 pb-2 flex items-center justify-between gap-2">
          <h1 className="font-serif text-[20px] font-bold text-texto">Resumen</h1>
          <BotonCompartir texto={generarTexto(resumenData)} />
        </div>

        <div className="flex px-4 gap-2 pb-3">
          {(["semanal", "mensual"] as const).map((p) => (
            <Link
              key={p}
              href={`/resumen?periodo=${p}&ref=${refStr}`}
              className={`flex-1 min-h-[36px] rounded-xl font-sans text-[13px] font-semibold text-center flex items-center justify-center transition-colors ${
                periodo === p ? "bg-verde text-white" : "bg-surface2 text-texto3 border border-borde"
              }`}
            >
              {p === "semanal" ? "Semanal" : "Mensual"}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 pb-3 gap-2">
          <Link href={`/resumen?periodo=${periodo}&ref=${prevRef}`} className="flex items-center justify-center min-h-[36px] min-w-[36px] rounded-xl bg-surface2 border border-borde text-texto2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <p className="font-sans text-[13px] font-semibold text-texto capitalize text-center">{label}</p>
          <Link href={`/resumen?periodo=${periodo}&ref=${nextRef}`} className="flex items-center justify-center min-h-[36px] min-w-[36px] rounded-xl bg-surface2 border border-borde text-texto2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Chips de asistencia */}
        <section className="space-y-2">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">Sesiones</p>
          <div className="flex gap-2">
            <StatChip valor={realizadas} label="Realizadas" variant="verde" />
            <StatChip valor={faltasConAviso + faltasSinAviso} label="Ausencias" variant="rojo" />
            {canceladas > 0 && <StatChip valor={canceladas} label="Canceladas" variant="indigo" />}
          </div>
        </section>

        {/* Montos globales */}
        <section className="space-y-2">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">Facturación</p>
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

        {/* Por paciente — visible en semanal Y mensual */}
        {porPaciente.length > 0 && (
          <section className="space-y-2">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">Por paciente</p>
            <div className="rounded-2xl border border-borde bg-surface divide-y divide-borde overflow-hidden">
              {porPaciente.map((p) => {
                const debe = p.facturado - p.cobrado;
                return (
                  <Link
                    key={p.id}
                    href={`/resumen/${p.id}?periodo=${periodo}&ref=${refStr}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-surface2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-sans text-[14px] font-semibold text-texto truncate">{p.nombre}</p>
                        <span className="font-mono text-[14px] font-bold text-texto shrink-0 ml-2">
                          {formatMonto(p.facturado)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-sans text-[12px] text-verde">Cobrado {formatMonto(p.cobrado)}</span>
                        {debe > 0 && (
                          <span className="font-sans text-[12px] text-naranja">Debe {formatMonto(debe)}</span>
                        )}
                      </div>
                    </div>
                    <Chevron />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Desglose efectivo / transferencia (solo mensual) */}
        {periodo === "mensual" && cobrado > 0 && (
          <section className="space-y-2">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">Forma de cobro</p>
            <div className="flex gap-2">
              <StatChip valor={formatMonto(efectivo)} label="Efectivo" variant="default" />
              <StatChip valor={formatMonto(transferencia)} label="Transferencia" variant="default" />
            </div>
          </section>
        )}

        {realizadas === 0 && faltasConAviso === 0 && faltasSinAviso === 0 && canceladas === 0 && (
          <p className="font-sans text-[14px] text-texto3 text-center py-6">
            Sin sesiones registradas en este período.
          </p>
        )}
      </div>
    </div>
  );
}
