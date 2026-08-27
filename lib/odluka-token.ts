import { SignJWT, jwtVerify } from "jose";

const tajna = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-nesiguran-kljuc-promeni-u-produkciji",
);

export type OdlukaPayload = {
  /** Zahtev o kome se odlučuje. */
  zid: string;
  /** Admin kome je link poslat — odluka se pripisuje njemu. */
  aid: string;
};

/**
 * Token za odlučivanje iz mejla. Namerno NE sadrži akciju — link vodi na
 * stranicu sa detaljima gde se bira Odobri/Odbij, pa skener u mejl klijentu
 * koji „poseti" link ne može slučajno da odobri zahtev.
 */
export async function napraviOdlukaToken(p: OdlukaPayload): Promise<string> {
  return new SignJWT({ zid: p.zid, aid: p.aid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(tajna);
}

export async function procitajOdlukaToken(
  token: string,
): Promise<OdlukaPayload | null> {
  try {
    const { payload } = await jwtVerify(token, tajna);
    const zid = payload.zid as string | undefined;
    const aid = payload.aid as string | undefined;
    return zid && aid ? { zid, aid } : null;
  } catch {
    return null;
  }
}
