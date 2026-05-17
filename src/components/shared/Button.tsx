import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClass: Record<Variant, string> = {
  primary:   "bg-verde text-white active:bg-[#3a7060]",
  secondary: "bg-surface2 text-texto border border-borde active:bg-borde",
  ghost:     "bg-transparent text-verde active:bg-verde-light",
  danger:    "bg-rojo-light text-rojo border border-[#e8b0b0] active:bg-[#f5d5d5]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`
        inline-flex min-h-[44px] items-center justify-center rounded-xl px-5
        font-sans text-[15px] font-bold transition-colors
        disabled:opacity-40
        ${variantClass[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
