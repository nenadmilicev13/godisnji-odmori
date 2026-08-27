"use client";

import { useState } from "react";
import Kalendar from "./Kalendar";
import MesecPregled from "./MesecPregled";

export default function KalendarPrikaz() {
  const [prikaz, setPrikaz] = useState<"mesec" | "timeline">("mesec");

  return (
    <div className="space-y-3">
      <div className="flex justify-stretch sm:justify-end">
        <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
          <button
            onClick={() => setPrikaz("mesec")}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none sm:py-1.5 ${
              prikaz === "mesec" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📅 Mesec
          </button>
          <button
            onClick={() => setPrikaz("timeline")}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none sm:py-1.5 ${
              prikaz === "timeline" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📊 Timeline
          </button>
        </div>
      </div>
      {prikaz === "mesec" ? <MesecPregled /> : <Kalendar />}
    </div>
  );
}
