"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/auth";
import type { EtatAction } from "@/components/formulaire";

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function lireClient(f: FormData) {
  return {
    nom: txt(f, "nom"),
    prenom: txt(f, "prenom"),
    telephone: txt(f, "telephone").replace(/[^\d+ ]/g, "").replace(/\s+/g, " "),
    pointure: txt(f, "pointure") || null,
  };
}

function valider(d: ReturnType<typeof lireClient>) {
  if (!d.nom || !d.prenom) return "Le nom et le prénom sont obligatoires.";
  if (d.telephone.replace(/\D/g, "").length < 8) return "Numéro de téléphone invalide.";
  return null;
}

export async function enregistrerClient(_: EtatAction, f: FormData): Promise<EtatAction> {
  await exigerSession();
  const id = Number(f.get("id")) || null;
  const d = lireClient(f);
  const erreur = valider(d);
  if (erreur) return { erreur };
  const c = id ? await prisma.client.update({ where: { id }, data: d }) : await prisma.client.create({ data: d });
  revalidatePath("/clients");
  redirect(`/clients/${c.id}`);
}

/** Création rapide depuis l'écran de vente : renvoie le client créé. */
export async function creerClientRapide(f: FormData) {
  await exigerSession();
  const d = lireClient(f);
  const erreur = valider(d);
  if (erreur) return { erreur };
  const c = await prisma.client.create({ data: d });
  revalidatePath("/clients");
  return { client: { id: c.id, nom: c.nom, prenom: c.prenom, telephone: c.telephone } };
}

export async function supprimerClient(id: number) {
  await exigerSession();
  const credits = await prisma.credit.findMany({
    where: { clientId: id, vente: { annulee: false } },
    include: { versements: true },
  });
  const du = credits.some((c) => c.montantTotal - c.versements.reduce((s, v) => s + v.montant, 0) > 0);
  if (du) {
    redirect(`/clients/${id}?erreur=credit`);
  }
  // Les ventes sont conservées (client retiré), les crédits soldés sont supprimés.
  await prisma.$transaction([
    prisma.credit.deleteMany({ where: { clientId: id } }),
    prisma.client.delete({ where: { id } }),
  ]);
  revalidatePath("/clients");
  redirect("/clients");
}
