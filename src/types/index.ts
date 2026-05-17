export type Profesional = {
  id: string;
  nombre: string;
  email: string;
  whatsapp: string | null;
  config_recordatorios: {
    frecuencia: "diaria" | "semanal" | "mensual";
    hora: string;
  };
  created_at: string;
};

export type ModalidadPago = "por_sesion" | "mensual";
export type PoliticaAusencia = "cobra_siempre" | "no_cobra_si_avisa" | "por_caso";

export type Paciente = {
  id: string;
  profesional_id: string;
  nombre: string;
  whatsapp: string | null;
  fecha_inicio: string | null;
  dias_horario: Record<string, string> | null;
  modalidad_pago: ModalidadPago | null;
  politica_ausencia: PoliticaAusencia | null;
  observaciones: string | null;
  activo: boolean;
  created_at: string;
};

export type Precio = {
  id: string;
  paciente_id: string;
  monto: number;
  vigente_desde: string;
  created_at: string;
};

export type EstadoSesion =
  | "realizada"
  | "falta_con_aviso"
  | "falta_sin_aviso"
  | "cancelada_profesional"
  | "vacaciones";

export type Sesion = {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string;
  estado: EstadoSesion;
  genera_cobro: boolean;
  monto: number | null;
  nota: string | null;
  created_at: string;
};

export type FormaPago = "efectivo" | "transferencia";

export type Pago = {
  id: string;
  paciente_id: string;
  sesion_id: string | null;
  fecha_pago: string;
  monto: number;
  forma_pago: FormaPago;
  created_at: string;
};

export type SesionConPaciente = Sesion & {
  pacientes: Pick<Paciente, "id" | "nombre" | "whatsapp">;
};
