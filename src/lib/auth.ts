import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSION, DUREE_SESSION, lireSession, signerSession } from "./session";
import { prisma } from "./prisma";

export async function sessionCourante() {
  const store = await cookies();
  const s = await lireSession(store.get(COOKIE_SESSION)?.value);
  if (!s) return null;
  const u = await prisma.utilisateur.findUnique({ where: { id: s.userId } });
  return u ? { id: u.id, identifiant: u.identifiant } : null;
}

/** À appeler au début de chaque action serveur / page protégée. */
export async function exigerSession() {
  const s = await sessionCourante();
  if (!s) redirect("/connexion");
  return s;
}

export async function ouvrirSession(userId: number, identifiant: string) {
  const token = await signerSession(userId, identifiant);
  const store = await cookies();
  store.set(COOKIE_SESSION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_NON_SECURISE !== "1",
    path: "/",
    maxAge: DUREE_SESSION,
  });
}

export async function fermerSession() {
  const store = await cookies();
  store.delete(COOKIE_SESSION);
}
