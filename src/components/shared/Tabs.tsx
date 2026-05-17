"use client";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex border-b border-borde bg-surface">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-h-[44px] py-2 font-sans text-[13px] font-semibold transition-colors border-b-2 ${
              isActive
                ? "border-verde text-verde"
                : "border-transparent text-texto3"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
