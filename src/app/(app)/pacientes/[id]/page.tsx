import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { Paciente, Sesion, Pago, Precio } from "@/types";
import FichaClient from "@/components/paciente/FichaClient";

export default async function FichaPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: paciente },
    { data: sesiones },
    { data: pagos },
    { data: precios },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .eq("profesional_id", user.id)
      .single(),
    supabase
      .from("sesiones")
      .select("*")
      .eq("paciente_id", id)
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false }),
    supabase
      .from("pagos")
      .select("*")
      .eq("paciente_id", id)
      .order("fecha_pago", { ascending: false }),
    supabase
      .from("precios")
      .select("*")
      .eq("paciente_id", id)
      .order("vigente_desde", { ascending: false }),
  ]);

  if (!paciente) notFound();

  return (
    <div className="mx-auto max-w-[390px]">
      <header className="sticky top-0 z-10 bg-surface border-b border-borde px-4 pt-12 pb-3 flex items-center gap-3">
        <Link
          href="/pacientes"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2 text-texto2 shrink-0"
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="font-serif text-[18px] font-bold text-texto truncate">
          {paciente.nombre}
        </h1>
      </header>

      <FichaClient
        paciente={paciente as Paciente}
        sesiones={(sesiones ?? []) as Sesion[]}
        pagos={(pagos ?? []) as Pago[]}
        precios={(precios ?? []) as Precio[]}
      />
    </div>
  );
}
