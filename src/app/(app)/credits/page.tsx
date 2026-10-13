import Link from "next/link";
import { Montant } from "@/components/montant";
import type { Metadata } from "next";
import { Download, HandCoins, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateFr, fcfa, nomClient } from "@/lib/format";
import { calculCredit, type StatutCredit } from "@/lib/credit";
import { correspond } from "@/lib/recherche";
import { EnTete, LienBouton, Vide, classesChamp, cx } from "@/components/ui";
import { BadgeStatut } from "@/components/credit";
import { FiltresAuto } from "@/components/filtres-auto";

export const metadata: Metadata = { title: "Crédits" };

const ONGLETS: { id: string; label: string }[] = [
  { id: "", label: "À récupérer" },
  { id: "retard", label: "En retard" },
  { id: "solde", label: "Soldés" },
  { id: "tous", label: "Tous" },
];

export default async function PageCredits({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  const { statut = "", q = "" } = await searchParams;
  const tous = (
    await prisma.credit.findMany({
      where: { vente: { annulee: false } },
      include: { client: true, versements: { select: { montant: true } } },
    })
  ).map((c) => ({ ...c, ...calculCredit(c) }));

  const ordre: Record<StatutCredit, number> = { EN_RETARD: 0, EN_COURS: 1, SOLDE: 2 };
  const credits = tous
    .filter((c) =>
      statut === "tous" ? true : statut === "solde" ? c.statut === "SOLDE" : statut === "retard" ? c.statut === "EN_RETARD" : c.statut !== "SOLDE",
    )
    .filter((c) => correspond(q, c.client.nom, c.client.prenom, c.client.telephone))
    .sort((a, b) => ordre[a.statut] - ordre[b.statut] || a.dateRappel.localeCompare(b.dateRappel));

  const aRecuperer = tous.reduce((s, c) => s + c.reste, 0);
  const enRetard = tous.filter((c) => c.statut === "EN_RETARD");
  const compte = (id: string) =>
    id === "tous" ? tous.length : id === "solde" ? tous.filter((c) => c.statut === "SOLDE").length : id === "retard" ? enRetard.length : tous.filter((c) => c.statut !== "SOLDE").length;

  return (
    <>
      <EnTete
        titre="Crédits"
        sousTitre="Suivi des paiements échelonnés et des rappels."
        actions={
          <LienBouton href="/api/export/credits" variante="secondaire" prefetch={false}>
            <Download className="h-4 w-4" strokeWidth={1.75} /> Excel
          </LienBouton>
        }
      />

      <dl className="chiffres mb-10 grid grid-cols-2 gap-6 border-y border-trait py-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-doux">Reste à récupérer</dt>
          <dd className="mt-1 text-2xl font-extrabold tracking-tight text-accent sm:text-4xl"><Montant valeur={aRecuperer} /></dd>
        </div>
        <div>
          <dt className="text-sm text-doux">En retard</dt>
          <dd className={cx("mt-1 text-2xl font-extrabold tracking-tight sm:text-4xl", enRetard.length > 0 && "text-erreur")}>
            <Montant valeur={enRetard.reduce((s, c) => s + c.reste, 0)} />
          </dd>
        </div>
        <div className="hidden sm:block">
          <dt className="text-sm text-doux">Crédits ouverts</dt>
          <dd className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{compte("")}</dd>
        </div>
      </dl>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="-mx-1 flex gap-1 overflow-x-auto">
          {ONGLETS.map((o) => (
            <Link
              key={o.id}
              href={`/credits${o.id ? `?statut=${o.id}` : ""}`}
              className={cx(
                "flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors duration-150",
                statut === o.id ? "bg-accent/[0.08] text-accent" : "text-doux hover:bg-surface hover:text-encre",
              )}
            >
              {o.label}
              <span className="chiffres text-xs opacity-70">{compte(o.id)}</span>
            </Link>
          ))}
        </nav>
        <FiltresAuto className="sm:w-64">
          {statut && <input type="hidden" name="statut" value={statut} />}
          <input name="q" type="search" defaultValue={q} placeholder="Rechercher un client…" className={classesChamp} />
        </FiltresAuto>
      </div>

      {credits.length === 0 ? (
        <Vide icone={<HandCoins className="h-8 w-8" strokeWidth={1.4} />} titre="Aucun crédit ici" texte="Les ventes à crédit apparaîtront dans cette liste." />
      ) : (
        <>
          {/* En-têtes (ordinateur) */}
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_1fr_110px_20px] gap-4 border-b border-trait pb-2 text-xs font-semibold uppercase tracking-[0.06em] text-doux md:grid">
            <span>Client</span>
            <span className="text-right">Montant dû</span>
            <span className="text-right">Déjà payé</span>
            <span className="text-right">Reste</span>
            <span>Rappel</span>
            <span>Statut</span>
            <span />
          </div>
          <ul className="divide-y divide-trait border-b border-trait md:border-t-0">
            {credits.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/credits/${c.id}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_110px_20px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold group-hover:text-accent">{nomClient(c.client)}</p>
                    <p className="chiffres truncate text-sm text-doux">{c.client.telephone}</p>
                  </div>
                  <span className="chiffres hidden text-right md:block">{fcfa(c.montantTotal)}</span>
                  <span className="chiffres hidden text-right text-doux md:block">{fcfa(c.paye)}</span>
                  <span className={cx("chiffres text-right font-bold", c.reste === 0 && "text-doux")}>{fcfa(c.reste)}</span>
                  <span className={cx("chiffres text-sm md:text-[15px]", c.statut === "EN_RETARD" ? "font-semibold text-erreur" : "text-doux")}>
                    <span className="md:hidden">Rappel </span>
                    {dateFr(c.dateRappel)}
                  </span>
                  <span className="justify-self-end md:justify-self-start">
                    <BadgeStatut statut={c.statut} />
                  </span>
                  <ChevronRight className="hidden h-5 w-5 text-doux/60 md:block" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
