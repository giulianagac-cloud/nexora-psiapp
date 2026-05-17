import Link from "next/link";
import type { Sesion } from "@/types";
import Badge from "@/components/shared/Badge";
import { formatFecha, formatHora, formatMonto } from "@/lib/utils";

type Props = {
  sesion: Sesion;
  pacienteId: string;
};

export default function HistorialSesionRow({ sesion, pacienteId }: Props) {
  return (
    <Link
      href={`/pacientes/${pacienteId}/registrar?fecha=${sesion.fecha}`}
      className="flex items-center gap-3 rounded-2xl border border-borde bg-surface px-4 py-3 min-h-[60px] active:bg-surface2 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-sans text-[13px] font-semibold text-texto capitalize">
            {formatFecha(sesion.fecha)}
          </p>
          <span className="font-mono text-[11px] text-texto3">{formatHora(sesion.hora)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant={sesion.estado} />
          {sesion.genera_cobro && sesion.monto != null && (
            <span className="font-mono text-[12px] font-bold text-texto2">
              {formatMonto(sesion.monto)}
            </span>
          )}
        </div>
      </div>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.5}
        className="shrink-0 text-texto3"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
