// Gestion de la session (compatible middleware / edge).
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const COOKIE_SESSION = "boutique_session";
export const DUREE_SESSION = 60 * 60 * 24 * 30; // 30 jours

function cle() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET manquant ou trop court dans le fichier .env");
  }
  return new TextEncoder().encode(secret);
}

export async function signerSession(userId: number, identifiant: string) {
  return new SignJWT({ identifiant })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${DUREE_SESSION}s`)
    .sign(cle());
}

export async function lireSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, cle(), { algorithms: ["HS256"] });
    return { userId: Number(payload.sub), identifiant: String(payload.identifiant ?? "") };
  } catch {
    return null;
  }
}
