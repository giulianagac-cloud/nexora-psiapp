import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/shared/LogoutButton";
import VacacionesForm from "@/components/ajustes/VacacionesForm";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface px-4 pt-12 pb-3 border-b border-borde">
        <h1 className="font-serif text-[20px] font-bold text-texto">Ajustes</h1>
      </header>

      <div className="px-4 py-6 space-y-8">
        {/* Cuenta */}
        <section className="space-y-3">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
            Cuenta
          </p>
          <div className="rounded-2xl border border-borde bg-surface px-4 py-3">
            <p className="font-sans text-[15px] text-texto">{user?.email}</p>
          </div>
          <LogoutButton />
        </section>

        {/* Ausencias */}
        <section className="space-y-3">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-texto3">
              Registrar ausencia
            </p>
            <p className="font-sans text-[12px] text-texto3 mt-1">
              Marca un período de vacaciones o ausencia propia. Se crea una sesión con estado "Vacaciones" para cada paciente que tenga turno en ese rango de fechas.
            </p>
          </div>
          <VacacionesForm />
        </section>
      </div>
    </div>
  );
}
