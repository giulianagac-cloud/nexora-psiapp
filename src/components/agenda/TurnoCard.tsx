import Link from "next/link";
import type { Sesion } from "@/types";
import Badge from "@/components/shared/Badge";
import { formatHora } from "@/lib/utils";

type Props = {
  paciente: { id: string; nombre: string };
  hora: string;
  sesion: Sesion | null;
  fecha: string;
};

export default function TurnoCard({ paciente, hora, sesion, fecha }: Props) {
  const badgeVariant = sesion?.estado ?? "sin_registrar";

  return (
    <Link
      href={`/pacientes/${paciente.id}/registrar?fecha=${fecha}`}
      className="flex items-center gap-3 rounded-2xl border border-borde bg-surface px-4 py-3 min-h-[64px] active:bg-surface2 transition-colors"
    >
      <span className="font-mono text-[13px] font-medium text-texto2 w-[42px] shrink-0">
        {formatHora(hora)}
      </span>

      <div className="w-px h-8 bg-borde shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-sans text-[14px] font-semibold text-texto truncate leading-tight">
          {paciente.nombre}
        </p>
        <div className="mt-1">
          <Badge variant={badgeVariant} />
        </div>
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
  );
}
