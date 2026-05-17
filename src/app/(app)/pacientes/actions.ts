"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { EstadoSesion, FormaPago } from "@/types";

export async function crearPaciente(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nombre = (formData.get("nombre") as string).trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  let diasHorario: Record<string, string> | null = null;
  try {
    const parsed = JSON.parse(formData.get("dias_horario") as string);
    if (Object.keys(parsed).length > 0) diasHorario = parsed;
  } catch {}

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .insert({
      profesional_id: user.id,
      nombre,
      whatsapp: (formData.get("whatsapp") as string).trim() || null,
      fecha_inicio: (formData.get("fecha_inicio") as string) || null,
      dias_horario: diasHorario,
      modalidad_pago: (formData.get("modalidad_pago") as string) || null,
      politica_ausencia: (formData.get("politica_ausencia") as string) || null,
      observaciones: (formData.get("observaciones") as string).trim() || null,
      activo: true,
    })
    .select("id")
    .single();

  if (error || !paciente) {
    return { error: "No se pudo guardar el paciente. Intentá de nuevo." };
  }

  const monto = parseFloat(formData.get("monto_inicial") as string);
  if (!isNaN(monto) && monto > 0) {
    const fechaInicio =
      (formData.get("fecha_inicio") as string) ||
      new Date().toISOString().split("T")[0];
    await supabase.from("precios").insert({
      paciente_id: paciente.id,
      monto,
      vigente_desde: fechaInicio,
    });
  }

  redirect(`/pacientes/${paciente.id}`);
}

// ── Registrar sesión ─────────────────────────────────────────────────────────

type RegistrarParams = {
  pacienteId: string;
  fecha: string;
  hora: string;
  estado: EstadoSesion;
  generaCobro: boolean;
  monto: number;
  abono: boolean;
  formaPago?: FormaPago;
};

type RegistrarResult = { ok: true } | { ok: false; error: string };

export async function registrarSesion(params: RegistrarParams): Promise<RegistrarResult> {
  const { pacienteId, fecha, hora, estado, generaCobro, monto, abono, formaPago } = params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  // Upsert sesión (insert o update si ya existe)
  const { data: existente } = await supabase
    .from("sesiones")
    .select("id")
    .eq("paciente_id", pacienteId)
    .eq("fecha", fecha)
    .maybeSingle();

  let sesionId: string;

  if (existente) {
    const { error } = await supabase
      .from("sesiones")
      .update({ estado, genera_cobro: generaCobro, monto: generaCobro ? monto : null, hora })
      .eq("id", existente.id);
    if (error) return { ok: false, error: "Error al actualizar la sesión." };
    sesionId = existente.id;
  } else {
    const { data, error } = await supabase
      .from("sesiones")
      .insert({
        paciente_id: pacienteId,
        fecha,
        hora,
        estado,
        genera_cobro: generaCobro,
        monto: generaCobro ? monto : null,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Error al registrar la sesión." };
    sesionId = data.id;
  }

  // Manejar pago
  const { data: pagoExistente } = await supabase
    .from("pagos")
    .select("id")
    .eq("sesion_id", sesionId)
    .maybeSingle();

  if (abono && formaPago) {
    if (pagoExistente) {
      await supabase
        .from("pagos")
        .update({ monto, forma_pago: formaPago, fecha_pago: fecha })
        .eq("id", pagoExistente.id);
    } else {
      await supabase.from("pagos").insert({
        paciente_id: pacienteId,
        sesion_id: sesionId,
        fecha_pago: fecha,
        monto,
        forma_pago: formaPago,
      });
    }
  } else if (pagoExistente) {
    await supabase.from("pagos").delete().eq("id", pagoExistente.id);
  }

  return { ok: true };
}

// ── Registrar aumento de precio ───────────────────────────────────────────────

export async function registrarAumento(params: {
  pacienteId: string;
  monto: number;
  vigenteDesde: string;
}): Promise<{ error: string | null }> {
  const { pacienteId, monto, vigenteDesde } = params;
  if (isNaN(monto) || monto <= 0) return { error: "Ingresá un monto válido." };
  if (!vigenteDesde) return { error: "Ingresá la fecha de vigencia." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("precios").insert({
    paciente_id: pacienteId,
    monto,
    vigente_desde: vigenteDesde,
  });

  return { error: error ? "Error al guardar el precio." : null };
}

// ── Desactivar paciente ───────────────────────────────────────────────────────

export async function desactivarPaciente(pacienteId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("pacientes")
    .update({ activo: false })
    .eq("id", pacienteId)
    .eq("profesional_id", user.id);
}

// ── Registrar vacaciones (cancelación por período) ────────────────────────────

const DIAS_SEMANA = [
  "domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado",
] as const;

function toDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function registrarVacaciones(
  _prev: { error: string | null; mensaje: string | null },
  formData: FormData
): Promise<{ error: string | null; mensaje: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado.", mensaje: null };

  const fechaInicio = formData.get("fecha_inicio") as string;
  const fechaFin = formData.get("fecha_fin") as string;

  if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) {
    return { error: "Ingresá un rango de fechas válido.", mensaje: null };
  }

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("id, dias_horario")
    .eq("profesional_id", user.id)
    .eq("activo", true)
    .not("dias_horario", "is", null);

  if (!pacientes || pacientes.length === 0) {
    return { error: null, mensaje: "No hay pacientes activos con horario asignado." };
  }

  // Generar lista de sesiones a crear
  const [y0, m0, d0] = fechaInicio.split("-").map(Number);
  const [y1, m1, d1] = fechaFin.split("-").map(Number);
  const inicio = new Date(y0, m0 - 1, d0);
  const fin = new Date(y1, m1 - 1, d1);

  type NuevaSesion = {
    paciente_id: string;
    fecha: string;
    hora: string;
    estado: string;
    genera_cobro: boolean;
    monto: null;
  };

  const candidatas: NuevaSesion[] = [];

  for (const d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const diaNombre = DIAS_SEMANA[d.getDay()];
    const fechaStr = toDateStr(new Date(d));

    for (const p of pacientes) {
      const dh = p.dias_horario as Record<string, string>;
      if (!(diaNombre in dh)) continue;
      candidatas.push({
        paciente_id: p.id,
        fecha: fechaStr,
        hora: dh[diaNombre],
        estado: "vacaciones",
        genera_cobro: false,
        monto: null,
      });
    }
  }

  if (candidatas.length === 0) {
    return { error: null, mensaje: "Ningún paciente tiene sesiones en ese período." };
  }

  // Excluir sesiones ya existentes
  const fechasUnicas = [...new Set(candidatas.map((s) => s.fecha))];
  const pacienteIds = [...new Set(candidatas.map((s) => s.paciente_id))];

  const { data: existentes } = await supabase
    .from("sesiones")
    .select("paciente_id, fecha")
    .in("paciente_id", pacienteIds)
    .in("fecha", fechasUnicas);

  const existenteSet = new Set(
    (existentes ?? []).map((e) => `${e.paciente_id}_${e.fecha}`)
  );

  const nuevas = candidatas.filter(
    (s) => !existenteSet.has(`${s.paciente_id}_${s.fecha}`)
  );

  if (nuevas.length > 0) {
    await supabase.from("sesiones").insert(nuevas);
  }

  const count = nuevas.length;
  return {
    error: null,
    mensaje: `${count} ${count === 1 ? "sesión registrada" : "sesiones registradas"} como vacaciones.`,
  };
}
