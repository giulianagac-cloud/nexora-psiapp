import type { EstadoSesion } from "@/types";

type BadgeVariant = EstadoSesion | "al_dia" | "debe" | "sin_registrar";

const variants: Record<BadgeVariant, { label: string; className: string }> = {
  realizada:             { label: "Asistió",         className: "bg-verde-light text-verde" },
  al_dia:                { label: "Al día",           className: "bg-verde-light text-verde" },
  debe:                  { label: "Debe",             className: "bg-naranja-light text-naranja" },
  sin_registrar:         { label: "Sin registrar",    className: "bg-surface2 text-texto3" },
  falta_con_aviso:       { label: "Faltó (avisó)",    className: "bg-rojo-light text-rojo" },
  falta_sin_aviso:       { label: "Faltó",            className: "bg-rojo-light text-rojo" },
  cancelada_profesional: { label: "Cancelada",        className: "bg-indigo-light text-indigo" },
  vacaciones:            { label: "Vacaciones",       className: "bg-indigo-light text-indigo" },
};

type Props = {
  variant: BadgeVariant;
  className?: string;
};

export default function Badge({ variant, className = "" }: Props) {
  const { label, className: variantClass } = variants[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold ${variantClass} ${className}`}
    >
      {label}
    </span>
  );
}
