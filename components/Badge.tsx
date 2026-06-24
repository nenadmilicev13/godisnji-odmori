import { StatusZahteva, STATUS_LABELE } from "@/lib/types";

const STILOVI: Record<StatusZahteva, string> = {
  na_cekanju: "bg-amber-100 text-amber-700 ring-amber-200",
  odobreno: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  odbijeno: "bg-rose-100 text-rose-700 ring-rose-200",
};

export default function Badge({ status }: { status: StatusZahteva }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STILOVI[status]}`}
    >
      {STATUS_LABELE[status]}
    </span>
  );
}
