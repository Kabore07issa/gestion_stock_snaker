import { aujourdhui } from "./dates";

export type StatutCredit = "EN_COURS" | "EN_RETARD" | "SOLDE";

export const LIBELLE_STATUT: Record<StatutCredit, string> = {
  EN_COURS: "En cours",
  EN_RETARD: "En retard",
  SOLDE: "Soldé",
};

export function calculCredit(
  c: { montantTotal: number; dateRappel: string; versements: { montant: number }[] },
  jour = aujourdhui(),
) {
  const paye = c.versements.reduce((s, v) => s + v.montant, 0);
  const reste = Math.max(0, c.montantTotal - paye);
  let statut: StatutCredit = "EN_COURS";
  if (reste === 0) statut = "SOLDE";
  else if (c.dateRappel < jour) statut = "EN_RETARD";
  const rappelAujourdhui = reste > 0 && c.dateRappel === jour;
  return { paye, reste, statut, rappelAujourdhui, aRelancer: reste > 0 && c.dateRappel <= jour };
}
