import Link from "next/link";
import NuevoPacienteForm from "@/components/paciente/NuevoPacienteForm";

export default function NuevoPacientePage() {
  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface px-4 pt-12 pb-3 border-b border-borde flex items-center gap-3">
        <Link
          href="/pacientes"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2 text-texto2"
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="font-serif text-[20px] font-bold text-texto">Nuevo paciente</h1>
      </header>

      <NuevoPacienteForm />
    </div>
  );
}
