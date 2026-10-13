import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const DOSSIER_PHOTOS = path.join(process.cwd(), "data", "uploads");
export const NOM_PHOTO_VALIDE = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const TAILLE_MAX = 6 * 1024 * 1024;

/** Enregistre la photo envoyée et renvoie son nom de fichier (ou null si aucune). */
export async function enregistrerPhoto(fichier: FormDataEntryValue | null): Promise<string | null> {
  if (!fichier || typeof fichier === "string" || fichier.size === 0) return null;
  const ext = TYPES[fichier.type];
  if (!ext) throw new Error("Format de photo non accepté (JPG, PNG ou WEBP).");
  if (fichier.size > TAILLE_MAX) throw new Error("Photo trop lourde (6 Mo maximum).");
  await mkdir(DOSSIER_PHOTOS, { recursive: true });
  const nom = `${randomUUID()}.${ext}`;
  await writeFile(path.join(DOSSIER_PHOTOS, nom), Buffer.from(await fichier.arrayBuffer()));
  return nom;
}

export async function supprimerPhoto(nom: string | null | undefined) {
  if (!nom || !NOM_PHOTO_VALIDE.test(nom)) return;
  await unlink(path.join(DOSSIER_PHOTOS, nom)).catch(() => {});
}

export function urlPhoto(nom: string | null | undefined) {
  return nom ? `/api/photos/${nom}` : null;
}
