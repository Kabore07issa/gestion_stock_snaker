import "server-only";
import { prisma } from "./prisma";
import { aujourdhui } from "./dates";
import { calculCredit } from "./credit";

/** Crédits non soldés dont la date de rappel est aujourd'hui ou dépassée. */
export async function creditsARelancer() {
  const jour = aujourdhui();
  const credits = await prisma.credit.findMany({
    where: { dateRappel: { lte: jour } },
    include: { client: true, versements: { select: { montant: true } } },
    orderBy: { dateRappel: "asc" },
  });
  return credits
    .map((c) => ({ ...c, ...calculCredit(c, jour) }))
    .filter((c) => c.reste > 0);
}
