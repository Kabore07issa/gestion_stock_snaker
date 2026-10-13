import Link from "next/link";
import { Montant } from "@/components/montant";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil, Phone, Trash2, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateFr, fcfa, libelleMode, nomClient } from "@/lib/format";
import { calculCredit } from "@/lib/credit";
import { supprimerClient } from "@/lib/actions/clients";
import { Badge, LienBouton, Message, TitreSection, cx } from "@/components/ui";
import { BoutonConfirmer } from "@/components/formulaire";
import { BadgeStatut, Initiales } from "@/components/credit";
import { RetourLien } from "@/components/retour";

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await prisma.client.findUnique({ where: { id: Number((await params).id) || 0 } });
  return { title: c ? nomClient(c) : "Client" };
}

export default async function PageClient({ params, searchParams }: P) {
  const id = Number((await params).id) || 0;
  const { erreur } = await searchParams;
  const c = await prisma.client.findUnique({
    where: { id },
    include: {
      ventes: { orderBy: { date: "desc" }, include: { lignes: true } },
      credits: { where: { vente: { annulee: false } }, include: { versements: true }, orderBy: { dateRappel: "asc" } },
    },
  });
  if (!c) notFound();

  const ventes = c.ventes.filter((v) => !v.annulee);
  const total = ventes.reduce((s, v) => s + v.total, 0);
  const paires = ventes.reduce((s, v) => s + v.lignes.reduce((t, l) => t + l.quantite, 0), 0);
  const credits = c.credits.map((cr) => ({ ...cr, ...calculCredit(cr) }));
  const reste = credits.reduce((s, cr) => s + cr.reste, 0);

  return (
    <>
      <RetourLien href="/clients">Clients</RetourLien>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Initiales prenom={c.prenom} nom={c.nom} className="h-16 w-16 text-lg" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{nomClient(c)}</h1>
            <p className="chiffres mt-1 text-doux">
              {c.telephone}
              {c.pointure ? ` · Pointure ${c.pointure}` : ""} · client depuis le {dateFr(c.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${c.telephone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-texte transition-colors duration-150 hover:bg-accent-hover">
            <Phone className="h-4 w-4" strokeWidth={1.75} /> Appeler
          </a>
          <LienBouton href={`/clients/${c.id}/modifier`} variante="secondaire">
            <Pencil className="h-4 w-4" strokeWidth={1.75} /> Modifier
          </LienBouton>
          <BoutonConfirmer action={supprimerClient.bind(null, c.id)} question="Supprimer ce client ? Ses ventes restent dans l'historique." variante="danger">
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            <span className="sr-only sm:not-sr-only">Supprimer</span>
          </BoutonConfirmer>
        </div>
      </div>

      {erreur === "credit" && (
        <div className="mt-6">
          <Message>Impossible de supprimer ce client : il a encore un crédit à rembourser.</Message>
        </div>
      )}

      <dl className="chiffres mt-10 grid grid-cols-3 border-y border-trait py-6">
        <div>
          <dt className="text-sm text-doux">Total des achats</dt>
          <dd className="mt-1 text-xl font-extrabold sm:text-3xl"><Montant valeur={total} /></dd>
        </div>
        <div>
          <dt className="text-sm text-doux">Paires achetées</dt>
          <dd className="mt-1 text-xl font-extrabold sm:text-3xl">{paires}</dd>
        </div>
        <div>
          <dt className="text-sm text-doux">Reste à payer</dt>
          <dd className={cx("mt-1 text-xl font-extrabold sm:text-3xl", reste > 0 ? "text-alerte" : "text-accent")}><Montant valeur={reste} /></dd>
        </div>
      </dl>

      {credits.length > 0 && (
        <section className="mt-12">
          <TitreSection>Crédits</TitreSection>
          <ul className="divide-y divide-trait border-y border-trait">
            {credits.map((cr) => (
              <li key={cr.id}>
                <Link href={`/credits/${cr.id}`} className="group flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="chiffres font-bold group-hover:text-accent">
                      {fcfa(cr.montantTotal)} <span className="font-normal text-doux">· payé {fcfa(cr.paye)}</span>
                    </p>
                    <p className="text-sm text-doux">Rappel le {dateFr(cr.dateRappel)}</p>
                  </div>
                  <div className="text-right">
                    <BadgeStatut statut={cr.statut} />
                    {cr.reste > 0 && <p className="chiffres mt-1 text-sm font-semibold">Reste {fcfa(cr.reste)}</p>}
                  </div>
                  <ChevronRight className="h-5 w-5 text-doux/60" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <TitreSection>Historique des achats</TitreSection>
        {c.ventes.length === 0 ? (
          <p className="text-sm text-doux">Aucun achat pour le moment.</p>
        ) : (
          <ul className="divide-y divide-trait border-y border-trait">
            {c.ventes.map((v) => (
              <li key={v.id}>
                <Link href={`/ventes/${v.id}`} className={cx("group flex items-center gap-4 py-4", v.annulee && "opacity-55")}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-accent">{v.lignes.map((l) => l.libelle).join(", ")}</p>
                    <p className="text-sm text-doux">
                      {dateFr(v.date)} · {libelleMode(v.modePaiement, v.operateur)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cx("chiffres font-bold", v.annulee && "line-through")}>{fcfa(v.total)}</p>
                    {v.annulee && <Badge ton="erreur">Annulée</Badge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
