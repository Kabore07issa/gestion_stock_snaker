import type { Metadata } from "next";
import { EnTete } from "@/components/ui";
import { FormulaireClient } from "@/components/formulaire-client";
import { RetourLien } from "@/components/retour";

export const metadata: Metadata = { title: "Nouveau client" };

export default function PageNouveauClient() {
  return (
    <>
      <RetourLien href="/clients">Clients</RetourLien>
      <EnTete titre="Nouveau client" />
      <FormulaireClient />
    </>
  );
}
