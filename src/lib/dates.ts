import { BOUTIQUE } from "@/config";

const fmtIso = new Intl.DateTimeFormat("en-CA", {
  timeZone: BOUTIQUE.fuseauHoraire,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Date du jour au format AAAA-MM-JJ (fuseau de la boutique). */
export function aujourdhui(): string {
  return fmtIso.format(new Date());
}

export function isoJour(d: Date): string {
  return fmtIso.format(d);
}

/** Ajoute n jours à une date AAAA-MM-JJ. */
export function ajouterJours(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Début d'un jour (AAAA-MM-JJ) en instant UTC.
 * Abidjan est en UTC+0 toute l'année, le calcul reste donc exact.
 */
export function debutJour(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function debutMois(iso: string): Date {
  return new Date(`${iso.slice(0, 7)}-01T00:00:00Z`);
}

export function estDateIso(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}
