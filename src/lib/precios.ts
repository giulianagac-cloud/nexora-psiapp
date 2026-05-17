import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPrecioVigente(
  supabase: SupabaseClient,
  pacienteId: string,
  fecha: Date
): Promise<number> {
  const { data } = await supabase
    .from("precios")
    .select("monto")
    .eq("paciente_id", pacienteId)
    .lte("vigente_desde", fecha.toISOString().split("T")[0])
    .order("vigente_desde", { ascending: false })
    .limit(1)
    .single();
  return data?.monto ?? 0;
}
