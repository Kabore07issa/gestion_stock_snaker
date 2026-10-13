"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/auth";
import { lireMontant } from "@/lib/format";
import { enregistrerPhoto, supprimerPhoto } from "@/lib/photos";
import type { EtatAction } from "@/components/formulaire";

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function enregistrerArticle(_: EtatAction, f: FormData): Promise<EtatAction> {
  await exigerSession();
  const id = Number(f.get("id")) || null;
  const donnees = {
    modele: txt(f, "modele"),
    marque: txt(f, "marque"),
    pointure: txt(f, "pointure").replace(",", "."),
    couleur: txt(f, "couleur"),
    prixAchat: lireMontant(f.get("prixAchat")),
    prixVente: lireMontant(f.get("prixVente")),
  };
  if (!donnees.modele || !donnees.marque || !donnees.pointure || !donnees.couleur)
    return { erreur: "Modèle, marque, pointure et couleur sont obligatoires." };
  if (donnees.prixVente <= 0) return { erreur: "Indiquez le prix de vente." };

  let photo: string | null;
  try {
    photo = await enregistrerPhoto(f.get("photo"));
  } catch (e) {
    return { erreur: (e as Error).message };
  }

  let articleId: number;
  if (id) {
    const ancien = await prisma.article.findUnique({ where: { id } });
    if (!ancien) return { erreur: "Article introuvable." };
    const retirer = f.get("retirerPhoto") === "1";
    if (photo || retirer) await supprimerPhoto(ancien.photo);
    await prisma.article.update({
      where: { id },
      data: { ...donnees, ...(photo ? { photo } : retirer ? { photo: null } : {}) },
    });
    articleId = id;
  } else {
    const quantite = Math.max(0, parseInt(txt(f, "quantite") || "0", 10) || 0);
    const a = await prisma.article.create({
      data: {
        ...donnees,
        photo,
        quantite,
        mouvements: quantite
          ? { create: { type: "ARRIVAGE", quantite, motif: "Stock initial" } }
          : undefined,
      },
    });
    articleId = a.id;
  }
  revalidatePath("/stock");
  redirect(`/stock/${articleId}`);
}

export async function supprimerArticle(id: number) {
  await exigerSession();
  const a = await prisma.article.delete({ where: { id } });
  await supprimerPhoto(a.photo);
  revalidatePath("/stock");
  redirect("/stock");
}

export async function ajouterArrivage(_: EtatAction, f: FormData): Promise<EtatAction> {
  await exigerSession();
  const articleId = Number(f.get("articleId"));
  const quantite = parseInt(txt(f, "quantite"), 10);
  if (!quantite || quantite <= 0) return { erreur: "Indiquez le nombre de paires reçues." };
  const prixAchat = lireMontant(f.get("prixAchat"));
  await prisma.$transaction([
    prisma.article.update({
      where: { id: articleId },
      data: { quantite: { increment: quantite }, ...(prixAchat > 0 ? { prixAchat } : {}) },
    }),
    prisma.mouvementStock.create({
      data: { articleId, type: "ARRIVAGE", quantite, motif: txt(f, "motif") || "Arrivage" },
    }),
  ]);
  revalidatePath(`/stock/${articleId}`);
  revalidatePath("/stock");
  return { ok: `${quantite} paire${quantite > 1 ? "s" : ""} ajoutée${quantite > 1 ? "s" : ""} au stock.`, t: Date.now() };
}

export async function ajusterStock(_: EtatAction, f: FormData): Promise<EtatAction> {
  await exigerSession();
  const articleId = Number(f.get("articleId"));
  const brut = txt(f, "quantite");
  const nouvelle = parseInt(brut, 10);
  const motif = txt(f, "motif");
  if (brut === "" || Number.isNaN(nouvelle) || nouvelle < 0) return { erreur: "Indiquez la quantité réelle en stock." };
  if (!motif) return { erreur: "Le motif de l'ajustement est obligatoire." };

  const a = await prisma.article.findUnique({ where: { id: articleId } });
  if (!a) return { erreur: "Article introuvable." };
  const ecart = nouvelle - a.quantite;
  if (ecart === 0) return { erreur: "La quantité est déjà correcte." };

  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { quantite: nouvelle } }),
    prisma.mouvementStock.create({ data: { articleId, type: "AJUSTEMENT", quantite: ecart, motif } }),
  ]);
  revalidatePath(`/stock/${articleId}`);
  revalidatePath("/stock");
  return { ok: `Stock ajusté (${ecart > 0 ? "+" : ""}${ecart}).`, t: Date.now() };
}
