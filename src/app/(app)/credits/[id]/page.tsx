import Link from "next/link";
import { Montant } from "@/components/montant";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateFr, dateHeure, fcfa, libelleMode, nomClient } from "@/lib/format";
import { calculCredit } from "@/lib/credit";
import { aujourdhui } from "@/lib/dates";
import { modifierDateRappel, supprimerVersement } from "@/lib/actions/credits";
import { OPERATEURS_MOBILE } from "@/config";
import { Badge, Carte, TitreSection, cx } from "@/components/ui";
import { BoutonConfirmer, BoutonEnvoi, Formulaire } from "@/components/formulaire";
import { BadgeStatut } from "@/components/credit";
import { BoutonRelancer, FormulaireVersement } from "@/components/versement";
import { RetourLien } from "@/components/retour";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await prisma.credit.findUnique({ where: { id: Number((await params).id) || 0 }, include: { client: true } });
  return { title: c ? `Crédit · ${nomClient(c.client)}` : "Crédit" };
}

export default async function PageCredit({ params }: P) {
  const id = Number((await params).id) || 0;
  const c = await prisma.credit.findUnique({
    where: { id },
    include: {
      client: true,
      versements: { orderBy: { date: "desc" } },
      vente: { include: { lignes: true } },
    },
  });
  if (!c || c.vente.annulee) notFound();
  const { paye, reste, statut } = calculCredit(c);
  const jour = aujourdhui();
  const pct = Math.min(100, Math.round((paye / c.montantTotal) * 100));

  return (
    <>
      <RetourLien href="/credits">Crédits</RetourLien>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <Link href={`/clients/${c.client.id}`} className="hover:text-accent">{nomClient(c.client)}</Link>
            </h1>
            <BadgeStatut statut={statut} />
          </div>
          <p className="mt-1.5 text-doux">
            Crédit du {dateFr(c.createdAt)} ·{" "}
            <Link href={`/ventes/${c.venteId}`} className="font-semibold text-accent underline-offset-4 hover:underline">vente n° {c.venteId}</Link>
          </p>
        </div>
        {reste > 0 && (
          <div className="sm:min-w-[320px]">
            <BoutonRelancer nom={nomClient(c.client)} telephone={c.client.telephone} plein />
          </div>
        )}
      </div>

      <dl className="chiffres mt-10 grid grid-cols-3 gap-4 border-t border-trait pt-6">
        <div>
          <dt className="text-sm text-doux">Montant dû</dt>
          <dd className="mt-1 text-xl font-extrabold sm:text-3xl"><Montant valeur={c.montantTotal} /></dd>
        </div>
        <div>
          <dt className="text-sm text-doux">Déjà payé</dt>
          <dd className="mt-1 text-xl font-extrabold sm:text-3xl"><Montant valeur={paye} /></dd>
        </div>
        <div>
          <dt className="text-sm text-doux">Reste</dt>
          <dd className={cx("mt-1 text-xl font-extrabold sm:text-3xl", reste ? (statut === "EN_RETARD" ? "text-erreur" : "text-accent") : "text-succes")}><Montant valeur={reste} /></dd>
        </div>
      </dl>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-trait" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="chiffres mt-2 text-sm text-doux">{pct} % remboursé</p>

      {reste > 0 && (
        <div className="mt-12 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <Carte>
            <TitreSection>Enregistrer un versement</TitreSection>
            <FormulaireVersement creditId={c.id} reste={reste} operateurs={OPERATEURS_MOBILE} />
          </Carte>
          <Carte>
            <TitreSection>Date de rappel</TitreSection>
            <p className={cx("chiffres text-2xl font-extrabold", c.dateRappel < jour && "text-erreur")}>{dateFr(c.dateRappel)}</p>
            <p className="mt-1 text-sm text-doux">
              {c.dateRappel < jour ? "Date dépassée — pensez à relancer." : c.dateRappel === jour ? "Rappel prévu aujourd'hui." : "Le client apparaîtra dans les rappels ce jour-là."}
            </p>
            <Formulaire action={modifierDateRappel} className="mt-5 space-y-3">
              <input type="hidden" name="creditId" value={c.id} />
              <input type="date" name="dateRappel" defaultValue={c.dateRappel} required className="block min-h-11 w-full rounded-md border border-trait bg-fond px-3.5 text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15" />
              <BoutonEnvoi plein variante="secondaire">Modifier la date</BoutonEnvoi>
            </Formulaire>
          </Carte>
        </div>
      )}

      <section className="mt-12">
        <TitreSection>Versements</TitreSection>
        {c.versements.length === 0 ? (
          <p className="text-sm text-doux">Aucun versement pour le moment.</p>
        ) : (
          <ul className="divide-y divide-trait border-y border-trait">
            {c.versements.map((v) => (
              <li key={v.id} className="flex items-center gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {libelleMode(v.mode, v.operateur)}
                    {v.estAvance && <Badge>Avance</Badge>}
                  </p>
                  <p className="truncate text-sm text-doux">
                    {dateHeure(v.date)}
                    {v.reference ? ` · ${v.reference}` : ""}
                  </p>
                </div>
                <span className="chiffres font-bold text-accent">+{fcfa(v.montant)}</span>
                <BoutonConfirmer action={supprimerVersement.bind(null, v.id)} question="Supprimer ce versement (erreur de saisie) ?" variante="fantome" taille="sm" aria-label="Supprimer le versement">
                  <Trash2 className="h-4 w-4 text-doux" strokeWidth={1.6} />
                </BoutonConfirmer>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <TitreSection>Articles</TitreSection>
        <ul className="divide-y divide-trait border-y border-trait">
          {c.vente.lignes.map((l) => (
            <li key={l.id} className="flex justify-between gap-4 py-3.5">
              <span className="min-w-0 truncate">{l.quantite > 1 ? `${l.quantite} × ` : ""}{l.libelle}</span>
              <span className="chiffres shrink-0 font-semibold">{fcfa(l.prixUnitaire * l.quantite)}</span>
            </li>
          ))}
          {c.vente.remise > 0 && (
            <li className="flex justify-between gap-4 py-3.5 text-doux">
              <span>Remise</span>
              <span className="chiffres">−{fcfa(c.vente.remise)}</span>
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
