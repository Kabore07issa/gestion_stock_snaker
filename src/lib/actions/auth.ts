"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerSession, fermerSession, ouvrirSession } from "@/lib/auth";
import type { EtatAction } from "@/components/formulaire";

// Petite protection contre les essais répétés (mémoire du serveur).
const essais = new Map<string, { n: number; jusqua: number }>();

export async function seConnecter(_: EtatAction, f: FormData): Promise<EtatAction> {
  const identifiant = String(f.get("identifiant") ?? "").trim().toLowerCase();
  const motDePasse = String(f.get("motDePasse") ?? "");
  if (!identifiant || !motDePasse) return { erreur: "Saisissez votre identifiant et votre mot de passe." };

  const e = essais.get(identifiant);
  if (e && e.n >= 5 && e.jusqua > Date.now()) {
    return { erreur: "Trop d'essais. Patientez quelques minutes avant de réessayer." };
  }

  const u = await prisma.utilisateur.findUnique({ where: { identifiant } });
  const ok = u ? await bcrypt.compare(motDePasse, u.motDePasse) : false;
  if (!u || !ok) {
    const n = (e && e.jusqua > Date.now() ? e.n : 0) + 1;
    essais.set(identifiant, { n, jusqua: Date.now() + 5 * 60_000 });
    return { erreur: "Identifiant ou mot de passe incorrect." };
  }
  essais.delete(identifiant);
  await ouvrirSession(u.id, u.identifiant);
  redirect("/");
}

/** Création du compte unique : possible uniquement si aucun compte n'existe. */
export async function creerCompte(_: EtatAction, f: FormData): Promise<EtatAction> {
  if ((await prisma.utilisateur.count()) > 0) return { erreur: "Un compte existe déjà." };
  const identifiant = String(f.get("identifiant") ?? "").trim().toLowerCase();
  const motDePasse = String(f.get("motDePasse") ?? "");
  const confirmation = String(f.get("confirmation") ?? "");
  if (!/^[a-z0-9._-]{3,32}$/.test(identifiant))
    return { erreur: "Identifiant : 3 à 32 caractères (lettres, chiffres, . _ -)." };
  if (motDePasse.length < 8) return { erreur: "Le mot de passe doit contenir au moins 8 caractères." };
  if (motDePasse !== confirmation) return { erreur: "Les deux mots de passe ne correspondent pas." };

  const u = await prisma.utilisateur.create({
    data: { identifiant, motDePasse: await bcrypt.hash(motDePasse, 12) },
  });
  await ouvrirSession(u.id, u.identifiant);
  redirect("/");
}

export async function seDeconnecter() {
  await fermerSession();
  redirect("/connexion");
}

export async function changerMotDePasse(_: EtatAction, f: FormData): Promise<EtatAction> {
  const s = await exigerSession();
  const actuel = String(f.get("actuel") ?? "");
  const nouveau = String(f.get("nouveau") ?? "");
  const u = await prisma.utilisateur.findUniqueOrThrow({ where: { id: s.id } });
  if (!(await bcrypt.compare(actuel, u.motDePasse))) return { erreur: "Mot de passe actuel incorrect." };
  if (nouveau.length < 8) return { erreur: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
  await prisma.utilisateur.update({ where: { id: u.id }, data: { motDePasse: await bcrypt.hash(nouveau, 12) } });
  return { ok: "Mot de passe modifié.", t: Date.now() };
}
