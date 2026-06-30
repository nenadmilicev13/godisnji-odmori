"use client";

import { useState } from "react";
import Kalendar from "./Kalendar";
import MesecPregled from "./MesecPregled";

export default function KalendarPrikaz() {
  const [prikaz, setPrikaz] = useState<"mesec" | "timeline">("mesec");

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setPrikaz("mesec")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              prikaz === "mesec" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📅 Mesec
          </button>
          <button
            onClick={() => setPrikaz("timeline")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
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
