import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sessionCourante } from "@/lib/auth";
import { aujourdhui, ajouterJours, debutJour, estDateIso } from "@/lib/dates";
import { dateFr, heure, libelleMode, nomClient } from "@/lib/format";
import { calculCredit, LIBELLE_STATUT } from "@/lib/credit";
import { BOUTIQUE } from "@/config";

export const dynamic = "force-dynamic";

const FCFA = '#,##0 "FCFA"';

function classeur(nom: string, colonnes: Partial<ExcelJS.Column>[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = BOUTIQUE.nom;
  wb.created = new Date();
  const ws = wb.addWorksheet(nom, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = colonnes;
  const entete = ws.getRow(1);
  entete.font = { bold: true, color: { argb: "FFFFFFFF" } };
  entete.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A7A4F" } };
  entete.alignment = { vertical: "middle" };
  entete.height = 22;
  return { wb, ws };
}

async function fichier(wb: ExcelJS.Workbook, nom: string) {
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nom}-${aujourdhui()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!(await sessionCourante())) return new Response("Non connecté", { status: 401 });
  const { type } = await params;
  const url = new URL(req.url);

  if (type === "ventes") {
    const du = url.searchParams.get("du") ?? "";
    const au = url.searchParams.get("au") ?? "";
    const mode = url.searchParams.get("mode") ?? "";
    const where: Prisma.VenteWhereInput = {};
    const date: Prisma.DateTimeFilter = {};
    if (estDateIso(du)) date.gte = debutJour(du);
    if (estDateIso(au)) date.lt = debutJour(ajouterJours(au, 1));
    if (date.gte || date.lt) where.date = date;
    if (mode) where.modePaiement = mode;

    const ventes = await prisma.vente.findMany({ where, include: { client: true, lignes: true }, orderBy: { date: "asc" } });
    const { wb, ws } = classeur("Ventes", [
      { header: "N°", key: "id", width: 8 },
      { header: "Date", key: "date", width: 12 },
      { header: "Heure", key: "heure", width: 8 },
      { header: "Client", key: "client", width: 24 },
      { header: "Articles", key: "articles", width: 50 },
      { header: "Paires", key: "paires", width: 8 },
      { header: "Sous-total", key: "sousTotal", width: 14, style: { numFmt: FCFA } },
      { header: "Remise", key: "remise", width: 12, style: { numFmt: FCFA } },
      { header: "Total", key: "total", width: 14, style: { numFmt: FCFA } },
      { header: "Marge", key: "marge", width: 14, style: { numFmt: FCFA } },
      { header: "Paiement", key: "mode", width: 15 },
      { header: "N° transaction", key: "reference", width: 22 },
      { header: "Statut", key: "statut", width: 10 },
    ]);
    for (const v of ventes) {
      ws.addRow({
        id: v.id,
        date: dateFr(v.date),
        heure: heure(v.date),
        client: v.client ? nomClient(v.client) : "",
        articles: v.lignes.map((l) => `${l.quantite} × ${l.libelle}`).join(" ; "),
        paires: v.lignes.reduce((s, l) => s + l.quantite, 0),
        sousTotal: v.sousTotal,
        remise: v.remise,
        total: v.total,
        marge: v.lignes.reduce((s, l) => s + (l.prixUnitaire - l.prixAchat) * l.quantite, 0) - v.remise,
        mode: libelleMode(v.modePaiement, v.operateur),
        reference: v.reference ?? "",
        statut: v.annulee ? "Annulée" : "Valide",
      });
    }
    return fichier(wb, "ventes");
  }

  if (type === "stock") {
    const articles = await prisma.article.findMany({ orderBy: [{ marque: "asc" }, { modele: "asc" }, { pointure: "asc" }] });
    const { wb, ws } = classeur("Stock", [
      { header: "Marque", key: "marque", width: 16 },
      { header: "Modèle", key: "modele", width: 26 },
      { header: "Couleur", key: "couleur", width: 16 },
      { header: "Pointure", key: "pointure", width: 10 },
      { header: "Quantité", key: "quantite", width: 10 },
      { header: "Prix d'achat", key: "prixAchat", width: 14, style: { numFmt: FCFA } },
      { header: "Prix de vente", key: "prixVente", width: 14, style: { numFmt: FCFA } },
      { header: "Valeur d'achat", key: "valeur", width: 16, style: { numFmt: FCFA } },
      { header: "État", key: "etat", width: 14 },
    ]);
    for (const a of articles)
      ws.addRow({
        ...a,
        valeur: Math.max(0, a.quantite) * a.prixAchat,
        etat: a.quantite <= 0 ? "Rupture" : a.quantite <= BOUTIQUE.seuilStockFaible ? "Stock faible" : "OK",
      });
    return fichier(wb, "stock");
  }

  if (type === "credits") {
    const credits = await prisma.credit.findMany({
      where: { vente: { annulee: false } },
      include: { client: true, versements: true },
      orderBy: { dateRappel: "asc" },
    });
    const { wb, ws } = classeur("Crédits", [
      { header: "Client", key: "client", width: 24 },
      { header: "Téléphone", key: "telephone", width: 18 },
      { header: "Vente n°", key: "vente", width: 10 },
      { header: "Date", key: "date", width: 12 },
      { header: "Montant dû", key: "du", width: 14, style: { numFmt: FCFA } },
      { header: "Déjà payé", key: "paye", width: 14, style: { numFmt: FCFA } },
      { header: "Reste", key: "reste", width: 14, style: { numFmt: FCFA } },
      { header: "Date de rappel", key: "rappel", width: 14 },
      { header: "Statut", key: "statut", width: 12 },
    ]);
    for (const c of credits) {
      const k = calculCredit(c);
      ws.addRow({
        client: nomClient(c.client),
        telephone: c.client.telephone,
        vente: c.venteId,
        date: dateFr(c.createdAt),
        du: c.montantTotal,
        paye: k.paye,
        reste: k.reste,
        rappel: dateFr(c.dateRappel),
        statut: LIBELLE_STATUT[k.statut],
      });
    }
    return fichier(wb, "credits");
  }

  return new Response("Export inconnu", { status: 404 });
}
