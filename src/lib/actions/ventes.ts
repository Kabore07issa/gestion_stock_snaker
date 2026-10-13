"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/auth";
import { aujourdhui, estDateIso } from "@/lib/dates";
import { libelleArticle } from "@/lib/format";
import { OPERATEURS_MOBILE } from "@/config";

export type NouvelleVente = {
  lignes: { articleId: number; quantite: number }[];
  clientId: number | null;
  remise: number;
  mode: "ESPECES" | "WAVE" | "MOBILE_MONEY" | "CREDIT";
  operateur?: string;
  reference?: string;
  montantRecu?: number;
  avance?: number;
  avanceMode?: "ESPECES" | "WAVE" | "MOBILE_MONEY";
  dateRappel?: string;
};

class ErreurVente extends Error {}

const entier = (n: unknown) => (Number.isFinite(Number(n)) ? Math.max(0, Math.round(Number(n))) : 0);

export async function enregistrerVente(v: NouvelleVente): Promise<{ erreur?: string; id?: number }> {
  await exigerSession();

  // Regroupe les lignes d'un même article
  const qtes = new Map<number, number>();
  for (const l of v.lignes ?? []) {
    const q = entier(l.quantite);
    if (q > 0) qtes.set(Number(l.articleId), (qtes.get(Number(l.articleId)) ?? 0) + q);
  }
  if (qtes.size === 0) return { erreur: "Ajoutez au moins un article." };
  if (!["ESPECES", "WAVE", "MOBILE_MONEY", "CREDIT"].includes(v.mode)) return { erreur: "Choisissez un mode de paiement." };

  const articles = await prisma.article.findMany({ where: { id: { in: [...qtes.keys()] } } });
  if (articles.length !== qtes.size) return { erreur: "Un article n'existe plus. Rechargez la page." };
  for (const a of articles) {
    if (a.quantite < qtes.get(a.id)!)
      return { erreur: `Stock insuffisant pour ${a.marque} ${a.modele} (P.${a.pointure}) : ${a.quantite} disponible(s).` };
  }

  const sousTotal = articles.reduce((s, a) => s + a.prixVente * qtes.get(a.id)!, 0);
  const remise = entier(v.remise);
  if (remise > sousTotal) return { erreur: "La remise dépasse le montant de la vente." };
  const total = sousTotal - remise;

  const clientId = v.clientId ? Number(v.clientId) : null;
  if (clientId && !(await prisma.client.findUnique({ where: { id: clientId } })))
    return { erreur: "Client introuvable." };

  const reference = (v.reference ?? "").trim() || null;
  let operateur: string | null = null;
  let montantRecu: number | null = null;
  let monnaie: number | null = null;
  let avance = 0;

  switch (v.mode) {
    case "ESPECES":
      montantRecu = entier(v.montantRecu) || total;
      if (montantRecu < total) return { erreur: "Le montant reçu est inférieur au total." };
      monnaie = montantRecu - total;
      break;
    case "WAVE":
      if (!reference) return { erreur: "Saisissez le numéro de transaction Wave." };
      break;
    case "MOBILE_MONEY":
      if (!OPERATEURS_MOBILE.includes(v.operateur as (typeof OPERATEURS_MOBILE)[number]))
        return { erreur: "Choisissez l'opérateur Mobile Money." };
      operateur = v.operateur!;
      if (!reference) return { erreur: "Saisissez le numéro de transaction." };
      break;
    case "CREDIT":
      if (!clientId) return { erreur: "Un client est obligatoire pour une vente à crédit." };
      if (!v.dateRappel || !estDateIso(v.dateRappel)) return { erreur: "La date de rappel est obligatoire." };
      if (v.dateRappel < aujourdhui()) return { erreur: "La date de rappel ne peut pas être dans le passé." };
      avance = entier(v.avance);
      if (avance >= total) return { erreur: "L'avance couvre tout le montant : choisissez un autre mode de paiement." };
      if (avance > 0 && !["ESPECES", "WAVE", "MOBILE_MONEY"].includes(v.avanceMode ?? ""))
        return { erreur: "Indiquez comment l'avance a été payée." };
      break;
  }

  try {
    const vente = await prisma.$transaction(async (tx) => {
      const cree = await tx.vente.create({
        data: {
          clientId,
          sousTotal,
          remise,
          total,
          modePaiement: v.mode,
          operateur,
          reference: v.mode === "CREDIT" ? null : reference,
          montantRecu,
          monnaie,
          lignes: {
            create: articles.map((a) => ({
              articleId: a.id,
              libelle: libelleArticle(a),
              prixUnitaire: a.prixVente,
              prixAchat: a.prixAchat,
              quantite: qtes.get(a.id)!,
            })),
          },
        },
      });

      for (const a of articles) {
        const q = qtes.get(a.id)!;
        // Décrément conditionnel : empêche un stock négatif même en cas de ventes simultanées
        const maj = await tx.article.updateMany({
          where: { id: a.id, quantite: { gte: q } },
          data: { quantite: { decrement: q } },
        });
        if (maj.count === 0) throw new ErreurVente(`Stock insuffisant pour ${a.marque} ${a.modele}.`);
        await tx.mouvementStock.create({
          data: { articleId: a.id, type: "VENTE", quantite: -q, venteId: cree.id, motif: `Vente n° ${cree.id}` },
        });
      }

      if (v.mode === "CREDIT") {
        await tx.credit.create({
          data: {
            venteId: cree.id,
            clientId: clientId!,
            montantTotal: total,
            dateRappel: v.dateRappel!,
            versements: avance
              ? {
                  create: {
                    montant: avance,
                    mode: v.avanceMode!,
                    estAvance: true,
                    reference,
                    operateur: v.avanceMode === "MOBILE_MONEY" && v.operateur ? v.operateur : null,
                  },
                }
              : undefined,
          },
        });
      }
      return cree;
    });

    revalidatePath("/", "layout");
    return { id: vente.id };
  } catch (e) {
    if (e instanceof ErreurVente) return { erreur: e.message };
    throw e;
  }
}

/** Annule une vente : remet les articles en stock et supprime le crédit associé. */
export async function annulerVente(id: number) {
  await exigerSession();
  await prisma.$transaction(async (tx) => {
    const v = await tx.vente.findUnique({ where: { id }, include: { lignes: true } });
    if (!v || v.annulee) return;
    for (const l of v.lignes) {
      if (!l.articleId) continue;
      await tx.article.update({ where: { id: l.articleId }, data: { quantite: { increment: l.quantite } } });
      await tx.mouvementStock.create({
        data: { articleId: l.articleId, type: "ANNULATION", quantite: l.quantite, venteId: id, motif: `Annulation vente n° ${id}` },
      });
    }
    await tx.credit.deleteMany({ where: { venteId: id } });
    await tx.vente.update({ where: { id }, data: { annulee: true, annuleeLe: new Date() } });
  });
  revalidatePath("/", "layout");
}
