interface Props {
  naslov: string;
  vrednost: string | number;
  opis?: string;
  ikona: React.ReactNode;
  boja: "brand" | "emerald" | "amber" | "rose";
}

const BOJE = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

export default function StatCard({ naslov, vrednost, opis, ikona, boja }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{naslov}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {vrednost}
          </p>
          {opis && <p className="mt-1 text-xs text-slate-400">{opis}</p>}
        </div>
        <div className={`rounded-xl p-3 ${BOJE[boja]}`}>{ikona}</div>
      </div>
    </div>
  );
}
