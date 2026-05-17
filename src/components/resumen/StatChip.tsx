type Variant = "verde" | "naranja" | "rojo" | "indigo" | "default";

const variantCls: Record<Variant, string> = {
  verde:   "bg-verde-light text-verde border-verde-mid",
  naranja: "bg-naranja-light text-naranja border-naranja-borde",
  rojo:    "bg-rojo-light text-rojo border-[#e8b0b0]",
  indigo:  "bg-indigo-light text-indigo border-indigo-borde",
  default: "bg-surface2 text-texto2 border-borde",
};

type Props = {
  valor: number | string;
  label: string;
  variant?: Variant;
};

export default function StatChip({ valor, label, variant = "default" }: Props) {
  return (
    <div className={`flex-1 rounded-2xl border px-3 py-3 text-center ${variantCls[variant]}`}>
      <p className="font-mono text-[22px] font-bold leading-tight">{valor}</p>
      <p className="font-sans text-[11px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">
        {label}
      </p>
    </div>
  );
}
