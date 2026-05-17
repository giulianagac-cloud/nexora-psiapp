import { formatMonto } from "@/lib/utils";
import type { Sesion, Pago } from "@/types";

function computeSaldo(sesiones: Sesion[], pagos: Pago[]): number {
  const pagadoPorSesion = new Map(
    pagos.filter((p) => p.sesion_id).map((p) => [p.sesion_id!, p.monto])
  );
  return sesiones.reduce((acc, s) => {
    if (!s.genera_cobro || s.monto == null) return acc;
    const pagado = pagadoPorSesion.get(s.id) ?? 0;
    return acc + (s.monto - pagado);
  }, 0);
}

type Props = { sesiones: Sesion[]; pagos: Pago[] };

export default function SaldoHero({ sesiones, pagos }: Props) {
  const saldo = computeSaldo(sesiones, pagos);

  if (saldo <= 0) {
    return (
      <div className="rounded-2xl border border-verde-mid bg-verde-light px-5 py-4">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-verde">
          Saldo
        </p>
        <p className="font-mono text-[28px] font-bold text-verde mt-1">Al día</p>
        <p className="font-sans text-[13px] text-verde mt-0.5">Sin deuda pendiente</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-naranja-borde bg-naranja-light px-5 py-4">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-naranja">
        Saldo pendiente
      </p>
      <p className="font-mono text-[28px] font-bold text-naranja mt-1">
        {formatMonto(saldo)}
      </p>
      <p className="font-sans text-[13px] text-naranja mt-0.5">Queda adeudando</p>
    </div>
  );
}
