import type { Client } from "@prisma/client";
import { enregistrerClient } from "@/lib/actions/clients";
import { Champ, LienBouton } from "./ui";
import { BoutonEnvoi, Formulaire } from "./formulaire";

export function FormulaireClient({ client }: { client?: Client }) {
  return (
    <Formulaire action={enregistrerClient} className="max-w-2xl">
      {client && <input type="hidden" name="id" value={client.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label="Prénom" name="prenom" defaultValue={client?.prenom} required autoComplete="off" />
        <Champ label="Nom" name="nom" defaultValue={client?.nom} required autoComplete="off" />
        <Champ label="Téléphone" name="telephone" type="tel" inputMode="tel" defaultValue={client?.telephone} required placeholder="07 00 00 00 00" />
        <Champ label="Pointure (facultatif)" name="pointure" inputMode="decimal" defaultValue={client?.pointure ?? ""} placeholder="42" />
      </div>
      <div className="mt-10 flex flex-wrap gap-2">
        <BoutonEnvoi taille="lg">{client ? "Enregistrer" : "Ajouter le client"}</BoutonEnvoi>
        <LienBouton href={client ? `/clients/${client.id}` : "/clients"} variante="fantome" taille="lg">
          Annuler
        </LienBouton>
      </div>
    </Formulaire>
  );
}
