import type { Metadata } from "next";
import { EnTete } from "@/components/ui";
import { FormulaireArticle } from "@/components/formulaire-article";
import { RetourLien } from "@/components/retour";

export const metadata: Metadata = { title: "Nouvel article" };

export default function PageNouvelArticle() {
  return (
    <>
      <RetourLien href="/stock">Stock</RetourLien>
      <EnTete titre="Nouvel article" sousTitre="Une référence = un modèle, une couleur et une pointure." />
      <FormulaireArticle />
    </>
  );
}
