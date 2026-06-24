import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const KOLACIC = "go_session";
const tajna = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-nesiguran-kljuc-promeni-u-produkciji",
);

/** Postavlja potpisan HttpOnly cookie sa ID-em prijavljenog zaposlenog. */
export async function kreirajSesiju(zaposleniId: string): Promise<void> {
  const token = await new SignJWT({ sub: zaposleniId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(tajna);

  cookies().set(KOLACIC, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function obrisiSesiju(): void {
  cookies().delete(KOLACIC);
}

/** Vraća ID iz validnog cookie-ja ili null. */
export async function trenutniKorisnikId(): Promise<string | null> {
  const token = cookies().get(KOLACIC)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, tajna);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}
