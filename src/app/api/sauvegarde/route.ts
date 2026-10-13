import { readFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { sessionCourante } from "@/lib/auth";
import { aujourdhui } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** Télécharge une copie cohérente de la base SQLite (VACUUM INTO). */
export async function GET() {
  if (!(await sessionCourante())) return new Response("Non connecté", { status: 401 });
  const dossier = await mkdtemp(path.join(tmpdir(), "boutique-"));
  const copie = path.join(dossier, "sauvegarde.db");
  try {
    await prisma.$executeRawUnsafe(`VACUUM INTO '${copie.replace(/'/g, "''")}'`);
    const data = await readFile(copie);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="sauvegarde-boutique-${aujourdhui()}.db"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await rm(dossier, { recursive: true, force: true });
  }
}
