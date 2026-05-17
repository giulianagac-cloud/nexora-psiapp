"use client";

import { useRouter } from "next/navigation";

const LETRAS = ["L", "M", "X", "J", "V", "S", "D"];

import { parseLocalDate as parseDate, toDateStr } from "@/lib/utils";

function getWeekDays(fechaStr: string): string[] {
  const date = parseDate(fechaStr);
  const dow = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
}

function shiftWeek(fechaStr: string, weeks: number): string {
  const d = parseDate(fechaStr);
  d.setDate(d.getDate() + weeks * 7);
  return toDateStr(d);
}

type Props = {
  fechaSeleccionada: string;
  hoy: string;
};

export default function MiniSemana({ fechaSeleccionada, hoy }: Props) {
  const router = useRouter();
  const weekDays = getWeekDays(fechaSeleccionada);

  function navigate(fecha: string) {
    router.push(`/agenda?fecha=${fecha}`);
  }

  return (
    <div className="flex items-center px-1 pb-2 gap-0.5">
      <button
        onClick={() => navigate(shiftWeek(fechaSeleccionada, -1))}
        className="flex items-center justify-center w-7 h-11 text-texto3 shrink-0"
        aria-label="Semana anterior"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="flex flex-1 gap-0.5">
        {weekDays.map((fecha, i) => {
          const dayNum = fecha.split("-")[2].replace(/^0/, "");
          const isSelected = fecha === fechaSeleccionada;
          const isHoy = fecha === hoy;

          return (
            <button
              key={fecha}
              onClick={() => navigate(fecha)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl min-h-[44px] transition-colors ${
                isSelected ? "bg-verde" : "hover:bg-surface2"
              }`}
            >
              <span
                className={`font-sans text-[10px] font-semibold leading-none ${
                  isSelected ? "text-white" : "text-texto3"
                }`}
              >
                {LETRAS[i]}
              </span>
              <span
                className={`font-sans text-[13px] font-bold mt-0.5 leading-none ${
                  isSelected ? "text-white" : isHoy ? "text-verde" : "text-texto"
                }`}
              >
                {dayNum}
              </span>
              {isHoy && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-verde mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate(shiftWeek(fechaSeleccionada, 1))}
        className="flex items-center justify-center w-7 h-11 text-texto3 shrink-0"
        aria-label="Semana siguiente"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
