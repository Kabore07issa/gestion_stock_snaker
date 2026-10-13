/**
 * Crée le compte du gérant, ou réinitialise son mot de passe.
 *   npm run compte -- <identifiant> <mot-de-passe>
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [identifiantBrut, motDePasse] = process.argv.slice(2);
  const identifiant = (identifiantBrut ?? "").trim().toLowerCase();
  if (!identifiant || !motDePasse) {
    console.log("Usage : npm run compte -- <identifiant> <mot-de-passe>");
    process.exit(1);
  }
  if (motDePasse.length < 8) {
    console.log("Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }
  const hash = await bcrypt.hash(motDePasse, 12);
  // Application mono-compte : on remplace tout compte existant.
  await prisma.$transaction([
    prisma.utilisateur.deleteMany({ where: { identifiant: { not: identifiant } } }),
    prisma.utilisateur.upsert({
      where: { identifiant },
      update: { motDePasse: hash },
      create: { identifiant, motDePasse: hash },
    }),
  ]);
  console.log(`Compte « ${identifiant} » prêt.`);
}

main().finally(() => prisma.$disconnect());
