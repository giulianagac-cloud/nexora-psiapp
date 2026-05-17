"use client";

import { useState } from "react";
import Tabs from "@/components/shared/Tabs";
import FichaAgenda from "./FichaAgenda";
import FichaPagos from "./FichaPagos";
import FichaInfo from "./FichaInfo";
import type { Paciente, Sesion, Pago, Precio } from "@/types";

type TabId = "agenda" | "pagos" | "info";

const TABS = [
  { id: "agenda", label: "Agenda" },
  { id: "pagos",  label: "Pagos"  },
  { id: "info",   label: "Info"   },
];

type Props = {
  paciente: Paciente;
  sesiones: Sesion[];
  pagos: Pago[];
  precios: Precio[];
};

export default function FichaClient({ paciente, sesiones, pagos, precios }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("agenda");

  return (
    <>
      <Tabs tabs={TABS} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      <div className="pb-8">
        {activeTab === "agenda" && (
          <FichaAgenda sesiones={sesiones} pacienteId={paciente.id} />
        )}
        {activeTab === "pagos" && (
          <FichaPagos
            pacienteId={paciente.id}
            sesiones={sesiones}
            pagos={pagos}
            precios={precios}
          />
        )}
        {activeTab === "info" && (
          <FichaInfo paciente={paciente} />
        )}
      </div>
    </>
  );
}
