import Link from "next/link";
import { Montant } from "@/components/montant";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Plus, Undo2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateHeure, fcfa, libelleMode, nomClient } from "@/lib/format";
import { annulerVente } from "@/lib/actions/ventes";
import { Badge, LienBouton, TitreSection } from "@/components/ui";
import { BoutonConfirmer } from "@/components/formulaire";
import { BoutonImprimer } from "@/components/bouton-imprimer";
import { Recu } from "@/components/recu";
import { RetourLien } from "@/components/retour";

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ nouvelle?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  return { title: `Vente n° ${(await params).id}` };
}

export default async function PageVente({ params, searchParams }: P) {
  const id = Number((await params).id) || 0;
  const { nouvelle } = await searchParams;
  const v = await prisma.vente.findUnique({
    where: { id },
    include: { lignes: true, client: true, credit: { include: { versements: true } } },
  });
  if (!v) notFound();
  const marge = v.lignes.reduce((s, l) => s + (l.prixUnitaire - l.prixAchat) * l.quantite, 0) - v.remise;

  return (
    <>
      <div className="no-print">
        <RetourLien href="/ventes">Ventes</RetourLien>
      </div>

      {nouvelle && !v.annulee && (
        <div className="no-print mb-8 flex animate-entree items-center gap-3 rounded-md bg-accent/[0.08] px-4 py-3.5 text-accent">
          <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <p className="font-semibold">Vente enregistrée. Le stock a été mis à jour.</p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div className="no-print">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Vente n° {v.id}</h1>
            {v.annulee && <Badge ton="erreur">Annulée</Badge>}
          </div>
          <p className="mt-1.5 text-doux">{dateHeure(v.date)}</p>

          <dl className="chiffres mt-8 grid grid-cols-2 gap-y-6 border-y border-trait py-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-doux">Total</dt>
              <dd className="mt-1 text-3xl font-extrabold tracking-tight text-accent"><Montant valeur={v.total} /></dd>
            </div>
            <div>
              <dt className="text-sm text-doux">Paiement</dt>
              <dd className="mt-1 text-lg font-bold">{libelleMode(v.modePaiement, v.operateur)}</dd>
              {v.reference && <dd className="font-mono text-xs text-doux">{v.reference}</dd>}
            </div>
            <div>
              <dt className="text-sm text-doux">Marge</dt>
              <dd className="mt-1 text-lg font-bold">{fcfa(marge)}</dd>
            </div>
          </dl>

          <section className="mt-10">
            <TitreSection>Client</TitreSection>
            {v.client ? (
              <Link href={`/clients/${v.client.id}`} className="font-semibold text-accent underline-offset-4 hover:underline">
                {nomClient(v.client)} · <span className="chiffres">{v.client.telephone}</span>
              </Link>
            ) : (
              <p className="text-doux">Client de passage</p>
            )}
            {v.credit && (
              <p className="mt-2">
                <Link href={`/credits/${v.credit.id}`} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
                  Voir le crédit et les versements →
                </Link>
              </p>
            )}
          </section>

          <div className="mt-10 flex flex-wrap gap-2">
            <BoutonImprimer />
            <LienBouton href="/ventes/nouvelle" variante="secondaire">
              <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} /> Nouvelle vente
            </LienBouton>
            {!v.annulee && (
              <BoutonConfirmer
                action={annulerVente.bind(null, v.id)}
                question={
                  v.credit
                    ? "Annuler cette vente ? Les articles seront remis en stock et le crédit (avec ses versements) sera supprimé."
                    : "Annuler cette vente ? Les articles seront remis en stock."
                }
                variante="danger"
              >
                <Undo2 className="h-4 w-4" strokeWidth={1.75} /> Annuler la vente
              </BoutonConfirmer>
            )}
          </div>
        </div>

        <div>
          <p className="no-print mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-doux">Aperçu du reçu</p>
          <Recu v={v} />
        </div>
      </div>
    </>
  );
}
