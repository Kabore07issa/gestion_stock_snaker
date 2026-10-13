import type { Metadata } from "next";
import { Database, FileSpreadsheet, LogOut } from "lucide-react";
import { exigerSession } from "@/lib/auth";
import { changerMotDePasse, seDeconnecter } from "@/lib/actions/auth";
import { BOUTIQUE } from "@/config";
import { Bouton, Carte, Champ, EnTete, TitreSection, classesBouton } from "@/components/ui";
import { BoutonEnvoi, Formulaire } from "@/components/formulaire";
import { ChoixTheme } from "@/components/theme";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Réglages" };

const EXPORTS = [
  { href: "/api/export/ventes", label: "Ventes" },
  { href: "/api/export/stock", label: "Stock" },
  { href: "/api/export/credits", label: "Crédits" },
];

export default async function PageReglages() {
  const session = await exigerSession();
  return (
    <>
      <EnTete titre="Réglages" sousTitre="Exports, sauvegarde et compte." />

      <div className="grid gap-4 md:grid-cols-2">
        <Carte>
          <TitreSection>Exporter vers Excel</TitreSection>
          <p className="mb-5 text-sm text-doux">Fichiers .xlsx à ouvrir dans Excel, Google Sheets ou LibreOffice.</p>
          <div className="grid gap-2">
            {EXPORTS.map((e) => (
              <a key={e.href} href={e.href} className={classesBouton("secondaire", "md", true) + " justify-start"}>
                <FileSpreadsheet className="h-[18px] w-[18px] text-accent" strokeWidth={1.6} />
                {e.label}
              </a>
            ))}
          </div>
        </Carte>

        <Carte>
          <TitreSection>Sauvegarde</TitreSection>
          <p className="mb-5 text-sm text-doux">
            Téléchargez une copie complète de la base (ventes, clients, stock, crédits). Faites-le au moins une fois par semaine et gardez le fichier sur une clé USB ou dans le cloud.
          </p>
          <a href="/api/sauvegarde" className={classesBouton("primaire", "lg", true)}>
            <Database className="h-[18px] w-[18px]" strokeWidth={1.6} />
            Télécharger une sauvegarde
          </a>
          <p className="mt-3 text-xs text-doux">Les photos des articles se trouvent dans le dossier data/uploads du serveur.</p>
        </Carte>

        <Carte>
          <TitreSection>Apparence</TitreSection>
          <ChoixTheme />
        </Carte>

        <Carte>
          <TitreSection>Mot de passe</TitreSection>
          <Formulaire action={changerMotDePasse} reinitialiser className="space-y-4">
            <input type="hidden" name="identifiant" value={session.identifiant} autoComplete="username" />
            <Champ label="Mot de passe actuel" name="actuel" type="password" autoComplete="current-password" required />
            <Champ label="Nouveau mot de passe" name="nouveau" type="password" autoComplete="new-password" required minLength={8} />
            <BoutonEnvoi variante="secondaire" plein>Changer le mot de passe</BoutonEnvoi>
          </Formulaire>
        </Carte>
      </div>

      <div className="mt-12 flex flex-col gap-6 border-t border-trait pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo taille="sm" />
          <p className="mt-2 text-sm text-doux">
            Connecté en tant que <span className="font-semibold text-encre">{session.identifiant}</span> · {BOUTIQUE.adresse}
          </p>
        </div>
        <form action={seDeconnecter}>
          <Bouton variante="danger" type="submit">
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Se déconnecter
          </Bouton>
        </form>
      </div>
    </>
  );
}
