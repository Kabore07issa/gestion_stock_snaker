/**
 * Données de démonstration : 10 articles, 5 clients, des ventes sur 30 jours
 * et quelques crédits (dont un en retard).
 * ATTENTION : efface les ventes, clients, articles et crédits existants
 * (le compte utilisateur est conservé).
 *   npm run db:seed
 */
import { PrismaClient, type Article, type Client } from "@prisma/client";

const prisma = new PrismaClient();
const JOUR = 86_400_000;

function ilYa(jours: number, h = 10, m = 0) {
  const d = new Date(Date.now() - jours * JOUR);
  d.setUTCHours(h, m, 0, 0); // Abidjan = UTC
  return d;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const libelle = (a: { marque: string; modele: string; couleur: string; pointure: string }) =>
  `${a.marque} ${a.modele} — ${a.couleur}, P.${a.pointure}`;

async function main() {
  await prisma.versement.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.ligneVente.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.mouvementStock.deleteMany();
  await prisma.article.deleteMany();
  await prisma.client.deleteMany();
  // Remet les compteurs d'identifiants à zéro (n° de vente à partir de 1)
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name <> 'Utilisateur'").catch(() => {});

  const donneesArticles = [
    { marque: "Nike", modele: "Air Force 1 '07", couleur: "Blanc", pointure: "42", prixAchat: 38000, prixVente: 55000, quantite: 6 },
    { marque: "Nike", modele: "Air Max 90", couleur: "Blanc / Vert", pointure: "43", prixAchat: 45000, prixVente: 65000, quantite: 4 },
    { marque: "Nike", modele: "Dunk Low Panda", couleur: "Noir / Blanc", pointure: "41", prixAchat: 42000, prixVente: 60000, quantite: 1 },
    { marque: "Adidas", modele: "Samba OG", couleur: "Blanc / Vert", pointure: "42", prixAchat: 40000, prixVente: 58000, quantite: 5 },
    { marque: "Adidas", modele: "Gazelle", couleur: "Vert", pointure: "40", prixAchat: 35000, prixVente: 50000, quantite: 3 },
    { marque: "Adidas", modele: "Stan Smith", couleur: "Blanc", pointure: "44", prixAchat: 30000, prixVente: 45000, quantite: 0 },
    { marque: "New Balance", modele: "550", couleur: "Blanc / Vert", pointure: "43", prixAchat: 48000, prixVente: 70000, quantite: 3 },
    { marque: "New Balance", modele: "530", couleur: "Argent", pointure: "39", prixAchat: 40000, prixVente: 57000, quantite: 1 },
    { marque: "Puma", modele: "Suede Classic", couleur: "Vert forêt", pointure: "42", prixAchat: 25000, prixVente: 38000, quantite: 7 },
    { marque: "Jordan", modele: "Air Jordan 1 Mid", couleur: "Blanc / Noir", pointure: "44", prixAchat: 55000, prixVente: 80000, quantite: 2 },
  ];
  // Nombre de ventes de démonstration par article (pour finir sur la quantité indiquée)
  const vendusDemo = [3, 2, 2, 2, 3, 0, 2, 1, 3, 2];
  const articles: Article[] = [];
  for (const [i, a] of donneesArticles.entries()) {
    articles.push(
      await prisma.article.create({
        data: {
          ...a,
          quantite: a.quantite + vendusDemo[i], // stock initial avant les ventes de démonstration
          createdAt: ilYa(40),
          mouvements: { create: { type: "ARRIVAGE", quantite: a.quantite + vendusDemo[i], motif: "Stock initial", createdAt: ilYa(40) } },
        },
      }),
    );
  }

  const clients: Client[] = [];
  for (const c of [
    { prenom: "Aya", nom: "Kouassi", telephone: "07 08 12 34 56", pointure: "39" },
    { prenom: "Konan", nom: "Yao", telephone: "05 44 21 87 90", pointure: "43" },
    { prenom: "Mariam", nom: "Traoré", telephone: "01 02 55 66 77", pointure: null },
    { prenom: "Ibrahim", nom: "Koné", telephone: "07 59 90 11 22", pointure: "42" },
    { prenom: "Fatou", nom: "Diabaté", telephone: "05 05 33 44 88", pointure: "40" },
  ]) {
    clients.push(await prisma.client.create({ data: { ...c, createdAt: ilYa(35) } }));
  }

  // Ventes payées comptant : [jours, article, client|null, mode, opérateur, remise]
  const ventes: [number, number, number | null, string, string | null, number][] = [
    [28, 0, 0, "ESPECES", null, 0],
    [26, 3, null, "WAVE", null, 0],
    [24, 8, 3, "MOBILE_MONEY", "Orange Money", 3000],
    [21, 1, null, "ESPECES", null, 0],
    [19, 4, 4, "WAVE", null, 0],
    [17, 8, null, "ESPECES", null, 0],
    [15, 6, 1, "MOBILE_MONEY", "MTN MoMo", 5000],
    [12, 0, null, "WAVE", null, 0],
    [10, 3, 2, "ESPECES", null, 0],
    [8, 9, null, "MOBILE_MONEY", "Moov Money", 0],
    [6, 8, 0, "ESPECES", null, 2000],
    [4, 2, null, "WAVE", null, 0],
    [3, 1, 3, "ESPECES", null, 0],
    [1, 4, null, "MOBILE_MONEY", "Orange Money", 0],
    [0, 7, null, "ESPECES", null, 0],
    [0, 0, 4, "WAVE", null, 0],
  ];

  async function vendre(jours: number, idx: number, clientIdx: number | null, mode: string, operateur: string | null, remise: number, heure = 11) {
    const a = articles[idx];
    const date = ilYa(jours, heure + (idx % 6), (idx * 7) % 60);
    const total = a.prixVente - remise;
    const v = await prisma.vente.create({
      data: {
        date,
        clientId: clientIdx == null ? null : clients[clientIdx].id,
        sousTotal: a.prixVente,
        remise,
        total,
        modePaiement: mode,
        operateur,
        reference: mode === "WAVE" || mode === "MOBILE_MONEY" ? `T${iso(date).replace(/-/g, "")}.${1000 + idx}${jours}` : null,
        montantRecu: mode === "ESPECES" ? Math.ceil(total / 5000) * 5000 : null,
        monnaie: mode === "ESPECES" ? Math.ceil(total / 5000) * 5000 - total : null,
        lignes: { create: { articleId: a.id, libelle: libelle(a), prixUnitaire: a.prixVente, prixAchat: a.prixAchat, quantite: 1 } },
      },
    });
    await prisma.article.update({ where: { id: a.id }, data: { quantite: { decrement: 1 } } });
    await prisma.mouvementStock.create({ data: { articleId: a.id, type: "VENTE", quantite: -1, venteId: v.id, motif: `Vente n° ${v.id}`, createdAt: date } });
    return v;
  }

  for (const [j, a, c, m, o, r] of ventes) await vendre(j, a, c, m, o, r);

  // Crédits
  const aujourdHui = iso(new Date());
  const credits: { jours: number; article: number; client: number; rappel: string; versements: [number, string, number][] }[] = [
    // En retard : rappel dépassé de 5 jours, avance de 20 000
    { jours: 20, article: 9, client: 1, rappel: iso(ilYa(5)), versements: [[20, "ESPECES", 20000]] },
    // Rappel aujourd'hui
    { jours: 9, article: 6, client: 0, rappel: aujourdHui, versements: [[9, "WAVE", 30000]] },
    // En cours, rappel dans 10 jours
    { jours: 2, article: 2, client: 2, rappel: iso(ilYa(-10)), versements: [] },
    // Soldé
    { jours: 25, article: 4, client: 4, rappel: iso(ilYa(15)), versements: [[25, "ESPECES", 20000], [14, "MOBILE_MONEY", 30000]] },
  ];
  for (const c of credits) {
    const v = await vendre(c.jours, c.article, c.client, "CREDIT", null, 0, 15);
    await prisma.credit.create({
      data: {
        venteId: v.id,
        clientId: clients[c.client].id,
        montantTotal: v.total,
        dateRappel: c.rappel,
        createdAt: v.date,
        versements: {
          create: c.versements.map(([j, mode, montant], i) => ({
            montant,
            mode,
            operateur: mode === "MOBILE_MONEY" ? "MTN MoMo" : null,
            estAvance: i === 0 && j === c.jours,
            date: ilYa(j, 16),
          })),
        },
      },
    });
  }

  console.log(`Démo prête : ${articles.length} articles, ${clients.length} clients, ${ventes.length + credits.length} ventes, ${credits.length} crédits.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
