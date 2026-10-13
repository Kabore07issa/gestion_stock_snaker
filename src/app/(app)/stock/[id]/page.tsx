import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateHeure, fcfa } from "@/lib/format";
import { ajouterArrivage, ajusterStock, supprimerArticle } from "@/lib/actions/stock";
import { Carte, Champ, LienBouton, TitreSection, Badge, cx } from "@/components/ui";
import { BoutonConfirmer, BoutonEnvoi, Formulaire } from "@/components/formulaire";
import { BadgeStock, Vignette } from "@/components/article";
import { ChampMontant } from "@/components/champ-montant";
import { RetourLien } from "@/components/retour";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await prisma.article.findUnique({ where: { id: Number((await params).id) || 0 } });
  return { title: a ? `${a.marque} ${a.modele}` : "Article" };
}

const TYPES: Record<string, string> = {
  ARRIVAGE: "Arrivage",
  AJUSTEMENT: "Ajustement",
  VENTE: "Vente",
  ANNULATION: "Annulation de vente",
};

export default async function PageArticle({ params }: P) {
  const id = Number((await params).id) || 0;
  const a = await prisma.article.findUnique({
    where: { id },
    include: { mouvements: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!a) notFound();
  const marge = a.prixVente - a.prixAchat;

  return (
    <>
      <RetourLien href="/stock">Stock</RetourLien>

      <div className="grid gap-8 md:grid-cols-[minmax(0,380px)_1fr] md:gap-12">
        <Vignette photo={a.photo} alt={a.modele} className="aspect-square rounded-md" />

        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-doux">{a.marque}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{a.modele}</h1>
          <p className="mt-2 text-doux">
            {a.couleur} · Pointure {a.pointure}
          </p>

          <dl className="chiffres mt-8 grid grid-cols-2 gap-y-6 border-y border-trait py-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-doux">En stock</dt>
              <dd className={cx("mt-1 text-4xl font-extrabold tracking-tight", a.quantite <= 0 ? "text-erreur" : a.quantite <= 1 ? "text-alerte" : "text-accent")}>
                {a.quantite}
              </dd>
              <dd className="mt-1.5">
                <BadgeStock quantite={a.quantite} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-doux">Prix de vente</dt>
              <dd className="mt-1 text-xl font-bold">{fcfa(a.prixVente)}</dd>
            </div>
            <div>
              <dt className="text-sm text-doux">Prix d&apos;achat</dt>
              <dd className="mt-1 text-xl font-bold">{fcfa(a.prixAchat)}</dd>
              <dd className="mt-0.5 text-sm text-doux">Marge {fcfa(marge)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <LienBouton href={`/stock/${a.id}/modifier`} variante="secondaire">
              <Pencil className="h-4 w-4" strokeWidth={1.75} /> Modifier
            </LienBouton>
            <BoutonConfirmer
              action={supprimerArticle.bind(null, a.id)}
              question="Supprimer définitivement cet article ? L'historique des ventes est conservé."
              variante="danger"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} /> Supprimer
            </BoutonConfirmer>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <Carte>
          <TitreSection>Arrivage</TitreSection>
          <Formulaire action={ajouterArrivage} reinitialiser className="space-y-4">
            <input type="hidden" name="articleId" value={a.id} />
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Paires reçues" name="quantite" type="number" min={1} inputMode="numeric" required placeholder="0" />
              <ChampMontant label="Nouveau prix d'achat" name="prixAchat" placeholder="Inchangé" />
            </div>
            <Champ label="Note (facultatif)" name="motif" placeholder="Fournisseur, facture…" />
            <BoutonEnvoi plein>Ajouter au stock</BoutonEnvoi>
          </Formulaire>
        </Carte>
        <Carte>
          <TitreSection>Ajustement manuel</TitreSection>
          <Formulaire action={ajusterStock} reinitialiser className="space-y-4">
            <input type="hidden" name="articleId" value={a.id} />
            <Champ label="Quantité réelle comptée" name="quantite" type="number" min={0} inputMode="numeric" required placeholder={String(a.quantite)} />
            <Champ label="Motif" name="motif" required placeholder="Inventaire, paire abîmée, perte…" />
            <BoutonEnvoi plein variante="secondaire">Ajuster le stock</BoutonEnvoi>
          </Formulaire>
        </Carte>
      </div>

      <section className="mt-14">
        <TitreSection>Mouvements de stock</TitreSection>
        {a.mouvements.length === 0 ? (
          <p className="text-sm text-doux">Aucun mouvement enregistré.</p>
        ) : (
          <ul className="divide-y divide-trait border-y border-trait">
            {a.mouvements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {TYPES[m.type] ?? m.type}
                    {m.type === "ANNULATION" && <Badge>Retour</Badge>}
                  </p>
                  <p className="truncate text-sm text-doux">
                    {dateHeure(m.createdAt)}
                    {m.motif ? ` · ${m.motif}` : ""}
                  </p>
                </div>
                <span className={cx("chiffres shrink-0 text-lg font-bold", m.quantite > 0 ? "text-accent" : "text-encre")}>
                  {m.quantite > 0 ? `+${m.quantite}` : m.quantite}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
