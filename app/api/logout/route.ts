import { NextResponse } from "next/server";
import { obrisiSesiju } from "@/lib/session";

export async function POST() {
  obrisiSesiju();
  return NextResponse.json({ ok: true });
}
