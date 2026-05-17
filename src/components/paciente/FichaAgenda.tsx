import type { Sesion } from "@/types";
import HistorialSesionRow from "./HistorialSesionRow";

type Props = {
  sesiones: Sesion[];
  pacienteId: string;
};

export default function FichaAgenda({ sesiones, pacienteId }: Props) {
  if (sesiones.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="font-sans text-[14px] text-texto3">Sin sesiones registradas.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-2">
      {sesiones.map((sesion) => (
        <HistorialSesionRow key={sesion.id} sesion={sesion} pacienteId={pacienteId} />
      ))}
    </div>
  );
}
