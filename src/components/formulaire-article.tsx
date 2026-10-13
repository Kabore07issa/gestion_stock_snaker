import type { Article } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { urlPhoto } from "@/lib/photos";
import { enregistrerArticle } from "@/lib/actions/stock";
import { Champ, LienBouton } from "./ui";
import { BoutonEnvoi, Formulaire } from "./formulaire";
import { ChampPhoto } from "./champ-photo";
import { ChampMontant } from "./champ-montant";

export async function FormulaireArticle({ article }: { article?: Article }) {
  const [marques, couleurs] = await Promise.all([
    prisma.article.findMany({ distinct: ["marque"], select: { marque: true } }),
    prisma.article.findMany({ distinct: ["couleur"], select: { couleur: true } }),
  ]);

  return (
    <Formulaire action={enregistrerArticle} className="max-w-2xl">
      {article && <input type="hidden" name="id" value={article.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label="Marque" name="marque" list="marques" defaultValue={article?.marque} required placeholder="Nike, Adidas, New Balance…" />
        <Champ label="Modèle" name="modele" defaultValue={article?.modele} required placeholder="Air Force 1" />
        <Champ label="Couleur" name="couleur" list="couleurs" defaultValue={article?.couleur} required placeholder="Blanc" />
        <Champ label="Pointure" name="pointure" defaultValue={article?.pointure} required inputMode="decimal" placeholder="42" />
        <ChampMontant label="Prix d'achat" name="prixAchat" defaut={article?.prixAchat} />
        <ChampMontant label="Prix de vente" name="prixVente" defaut={article?.prixVente} required />
        {!article && (
          <Champ label="Quantité initiale" name="quantite" type="number" min={0} inputMode="numeric" defaultValue={1} aide="Nombre de paires en stock aujourd'hui." />
        )}
      </div>
      <div className="mt-6">
        <ChampPhoto actuelle={urlPhoto(article?.photo)} />
      </div>
      <datalist id="marques">
        {marques.map((m) => (
          <option key={m.marque} value={m.marque} />
        ))}
      </datalist>
      <datalist id="couleurs">
        {couleurs.map((c) => (
          <option key={c.couleur} value={c.couleur} />
        ))}
      </datalist>
      <div className="mt-10 flex flex-wrap gap-2">
        <BoutonEnvoi taille="lg">{article ? "Enregistrer les modifications" : "Ajouter l'article"}</BoutonEnvoi>
        <LienBouton href={article ? `/stock/${article.id}` : "/stock"} variante="fantome" taille="lg">
          Annuler
        </LienBouton>
      </div>
    </Formulaire>
  );
}
