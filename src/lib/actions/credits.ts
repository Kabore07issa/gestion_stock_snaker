"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/auth";
import { lireMontant } from "@/lib/format";
import { estDateIso } from "@/lib/dates";
import { calculCredit } from "@/lib/credit";
import { OPERATEURS_MOBILE } from "@/config";
import type { EtatAction } from "@/components/formulaire";

export async function enregistrerVersement(_: EtatAction, f: FormData): Promise<EtatAction> {
  await exigerSession();
  const creditId = Number(f.get("creditId"));
  const montant = lireMontant(f.get("montant"));
  const mode = String(f.get("mode") ?? "");
  const operateur = String(f.get("operateur") ?? "") || null;
  const reference = String(f.get("reference") ?? "").trim() || null;

  const credit = await prisma.credit.findUnique({ where: { id: creditId }, include: { versements: true } });
  if (!credit) return { erreur: "Crédit introuvable." };
  const { reste } = calculCredit(credit);
  if (reste <= 0) return { erreur: "Ce crédit est déjà soldé." };
  if (montant <= 0) return { erreur: "Indiquez le montant versé." };
  if (montant > reste) return { erreur: `Le versement dépasse le reste à payer.` };
  if (!["ESPECES", "WAVE", "MOBILE_MONEY"].includes(mode)) return { erreur: "Choisissez le mode de paiement." };
  if (mode === "MOBILE_MONEY" && !OPERATEURS_MOBILE.includes(operateur as (typeof OPERATEURS_MOBILE)[number]))
    return { erreur: "Choisissez l'opérateur." };

  await prisma.versement.create({
    data: { creditId, montant, mode, operateur: mode === "MOBILE_MONEY" ? operateur : null, reference },
  });
  revalidatePath("/", "layout");
  return {
    ok: montant === reste ? "Versement enregistré. Le crédit est soldé." : "Versement enregistré.",
    t: Date.now(),
  };
}

export async function modifierDateRappel(_: EtatAction, f: FormData): Promise<EtatAction> {
  await exigerSession();
  const creditId = Number(f.get("creditId"));
  const date = String(f.get("dateRappel") ?? "");
  if (!estDateIso(date)) return { erreur: "Date invalide." };
  await prisma.credit.update({ where: { id: creditId }, data: { dateRappel: date } });
  revalidatePath("/", "layout");
  return { ok: "Date de rappel modifiée.", t: Date.now() };
}

export async function supprimerVersement(id: number) {
  await exigerSession();
  await prisma.versement.delete({ where: { id } });
  revalidatePath("/", "layout");
}
