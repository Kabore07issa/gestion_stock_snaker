import { readFile } from "node:fs/promises";
import path from "node:path";
import { DOSSIER_PHOTOS, NOM_PHOTO_VALIDE } from "@/lib/photos";
import { sessionCourante } from "@/lib/auth";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_: Request, { params }: { params: Promise<{ nom: string }> }) {
  if (!(await sessionCourante())) return new Response("Non connecté", { status: 401 });
  const { nom } = await params;
  if (!NOM_PHOTO_VALIDE.test(nom)) return new Response("Introuvable", { status: 404 });
  try {
    const data = await readFile(path.join(DOSSIER_PHOTOS, nom));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[nom.split(".").pop()!],
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
