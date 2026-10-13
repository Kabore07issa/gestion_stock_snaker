import { BOUTIQUE } from "@/config";

const NBSP = " ";

/** 45000 → "45 000" */
export function nombre(n: number): string {
  const s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return n < 0 ? `-${s}` : s;
}

/** 45000 → "45 000 FCFA" */
export function fcfa(n: number): string {
  return `${nombre(n)}${NBSP}FCFA`;
}

const fmtDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: BOUTIQUE.fuseauHoraire,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const fmtHeure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: BOUTIQUE.fuseauHoraire,
  hour: "2-digit",
  minute: "2-digit",
});

/** Date → "13/10/2026" ; accepte aussi "2026-10-13". */
export function dateFr(d: Date | string): string {
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [a, m, j] = d.split("-");
    return `${j}/${m}/${a}`;
  }
  return fmtDate.format(new Date(d));
}

export function heure(d: Date | string): string {
  return fmtHeure.format(new Date(d));
}

export function dateHeure(d: Date | string): string {
  return `${dateFr(d)} à ${heure(d)}`;
}

export const MODES: Record<string, string> = {
  ESPECES: "Espèces",
  WAVE: "Wave",
  MOBILE_MONEY: "Mobile Money",
  CREDIT: "Crédit",
};

export function libelleMode(mode: string, operateur?: string | null) {
  if (mode === "MOBILE_MONEY" && operateur) return operateur;
  return MODES[mode] ?? mode;
}

export function nomClient(c: { nom: string; prenom: string }) {
  return `${c.prenom} ${c.nom}`.trim();
}

export function libelleArticle(a: { marque: string; modele: string; couleur: string; pointure: string }) {
  return `${a.marque} ${a.modele} — ${a.couleur}, P.${a.pointure}`;
}

/** Lit un montant saisi (« 45 000 », « 45000 ») → entier >= 0. */
export function lireMontant(v: FormDataEntryValue | string | null | undefined): number {
  if (v == null) return 0;
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}
