import { LIBELLE_STATUT, type StatutCredit } from "@/lib/credit";
import { Badge } from "./ui";

export function BadgeStatut({ statut }: { statut: StatutCredit }) {
  const ton = statut === "SOLDE" ? "vert" : statut === "EN_RETARD" ? "erreur" : "neutre";
  return <Badge ton={ton}>{LIBELLE_STATUT[statut]}</Badge>;
}

export function Initiales({ prenom, nom, className = "" }: { prenom: string; nom: string; className?: string }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent ${className}`}
      aria-hidden
    >
      {(prenom[0] ?? "").toUpperCase()}
      {(nom[0] ?? "").toUpperCase()}
    </span>
  );
}
