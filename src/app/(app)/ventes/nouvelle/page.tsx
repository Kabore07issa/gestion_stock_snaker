import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { urlPhoto } from "@/lib/photos";
import { aujourdhui } from "@/lib/dates";
import { OPERATEURS_MOBILE } from "@/config";
import { EnTete } from "@/components/ui";
import { Caisse } from "@/components/caisse";
import { RetourLien } from "@/components/retour";

export const metadata: Metadata = { title: "Nouvelle vente" };

export default async function PageNouvelleVente() {
  const [articles, clients] = await Promise.all([
    prisma.article.findMany({ orderBy: [{ marque: "asc" }, { modele: "asc" }, { pointure: "asc" }] }),
    prisma.client.findMany({ select: { id: true, nom: true, prenom: true, telephone: true }, orderBy: { prenom: "asc" } }),
  ]);
  return (
    <>
      <RetourLien href="/ventes">Ventes</RetourLien>
      <EnTete titre="Nouvelle vente" sousTitre="Articles, client, paiement — et c'est encaissé." />
      <Caisse
        articles={articles.map((a) => ({
          id: a.id, marque: a.marque, modele: a.modele, couleur: a.couleur, pointure: a.pointure,
          prixVente: a.prixVente, quantite: a.quantite, photo: urlPhoto(a.photo),
        }))}
        clients={clients}
        operateurs={OPERATEURS_MOBILE}
        aujourdhui={aujourdhui()}
      />
    </>
  );
}
