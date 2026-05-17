"use client";

import { useState } from "react";

type Props = { texto: string };

export default function BotonCompartir({ texto }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 min-h-[44px] px-5 rounded-2xl border border-borde bg-surface font-sans text-[14px] font-semibold text-texto2 active:bg-surface2 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {copiado ? "Copiado!" : "Compartir"}
    </button>
  );
}
