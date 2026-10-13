import Link from "next/link";
import { Montant } from "@/components/montant";
import type { Metadata } from "next";
import { ArrowRight, BellRing, CheckCircle2, PackageX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fcfa, nomClient, dateFr } from "@/lib/format";
import { aujourdhui, ajouterJours, debutJour, debutMois, isoJour } from "@/lib/dates";
import { creditsARelancer } from "@/lib/requetes";
import { calculCredit } from "@/lib/credit";
import { BOUTIQUE } from "@/config";
import { Badge, TitreSection, cx } from "@/components/ui";
import { GraphiqueVentes } from "@/components/graphique-ventes";
import { BoutonRelancer } from "@/components/versement";
import { Vignette, BadgeStock } from "@/components/article";

export const metadata: Metadata = { title: "Accueil" };

const MODES = [
  { id: "ESPECES", label: "Espèces" },
  { id: "WAVE", label: "Wave" },
  { id: "MOBILE_MONEY", label: "Mobile Money" },
  { id: "CREDIT", label: "Crédit" },
];

function salutation() {
  const h = Number(
    new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: BOUTIQUE.fuseauHoraire })
      .formatToParts(new Date())
      .find((p) => p.type === "hour")?.value ?? 12,
  );
  return h < 18 ? "Bonjour" : "Bonsoir";
}

export default async function TableauDeBord() {
  const jour = aujourdhui();
  const debut30 = debutJour(ajouterJours(jour, -29));
  const debutDuMois = debutMois(jour);
  const debutDuJour = debutJour(jour);
  const depuis = debut30 < debutDuMois ? debut30 : debutDuMois;

  const [ventes, credits, rappels, alertesStock] = await Promise.all([
    prisma.vente.findMany({ where: { annulee: false, date: { gte: depuis } }, select: { date: true, total: true, modePaiement: true } }),
    prisma.credit.findMany({ where: { vente: { annulee: false } }, select: { montantTotal: true, dateRappel: true, versements: { select: { montant: true } } } }),
    creditsARelancer(),
    prisma.article.findMany({ where: { quantite: { lte: BOUTIQUE.seuilStockFaible } }, orderBy: [{ quantite: "asc" }, { marque: "asc" }], take: 8 }),
  ]);

  const duJour = ventes.filter((v) => v.date >= debutDuJour);
  const duMois = ventes.filter((v) => v.date >= debutDuMois);
  const somme = (l: { total: number }[]) => l.reduce((s, v) => s + v.total, 0);
  const totalMois = somme(duMois);

  const repartition = MODES.map((m) => ({ ...m, total: somme(duMois.filter((v) => v.modePaiement === m.id)) }));
  const maxMode = Math.max(...repartition.map((r) => r.total), 1);

  const enCours = credits.map((c) => calculCredit(c, jour)).filter((c) => c.reste > 0);
  const resteCredits = enCours.reduce((s, c) => s + c.reste, 0);

  const parJour = new Map<string, { total: number; nb: number }>();
  for (const v of ventes) {
    const j = isoJour(v.date);
    const e = parJour.get(j) ?? { total: 0, nb: 0 };
    parJour.set(j, { total: e.total + v.total, nb: e.nb + 1 });
  }
  const serie = Array.from({ length: 30 }, (_, i) => {
    const j = ajouterJours(jour, i - 29);
    return { jour: j, libelle: dateFr(j).slice(0, 5), ...(parJour.get(j) ?? { total: 0, nb: 0 }) };
  });
  const total30 = serie.reduce((s, d) => s + d.total, 0);

  const nomMois = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(debutDuMois);

  return (
    <>
      <div className="mb-10 sm:mb-14">
        <p className="text-[15px] text-doux first-letter:uppercase">
          {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: BOUTIQUE.fuseauHoraire }).format(new Date())}
        </p>
        <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-tight sm:text-5xl">{salutation()}.</h1>
      </div>

      {/* Chiffres clés */}
      <section className="chiffres grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 border-y border-trait py-8 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold text-doux">Ventes du jour</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-accent sm:text-[40px]"><Montant valeur={somme(duJour)} /></p>
          <p className="mt-2 text-sm text-doux">{duJour.length} vente{duJour.length > 1 ? "s" : ""}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-doux first-letter:uppercase">{nomMois}</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight sm:text-[40px]"><Montant valeur={totalMois} /></p>
          <p className="mt-2 text-sm text-doux">{duMois.length} vente{duMois.length > 1 ? "s" : ""}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-doux">Crédits à récupérer</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight sm:text-[40px]"><Montant valeur={resteCredits} /></p>
          <p className="mt-2 text-sm text-doux">{enCours.length} crédit{enCours.length > 1 ? "s" : ""} en cours</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-doux">Rappels du jour</p>
          <p className={cx("mt-2 text-[26px] font-extrabold leading-none tracking-tight sm:text-[40px]", rappels.length ? "text-erreur" : "text-encre")}>{rappels.length}</p>
          <p className="mt-2 text-sm text-doux">{rappels.filter((r) => r.statut === "EN_RETARD").length} en retard</p>
        </div>
      </section>

      <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-[1.6fr_1fr] lg:gap-12 [&>*]:min-w-0">
        {/* Graphique */}
        <section>
          <TitreSection action={<span className="chiffres text-sm font-semibold text-doux">{fcfa(total30)}</span>}>30 derniers jours</TitreSection>
          <GraphiqueVentes donnees={serie} />
        </section>

        {/* Répartition */}
        <section>
          <TitreSection>Encaissements du mois</TitreSection>
          <ul className="space-y-5">
            {repartition.map((r) => (
              <li key={r.id}>
                <div className="chiffres flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{r.label}</span>
                  <span className="font-bold">
                    {fcfa(r.total)}
                    <span className="ml-2 inline-block w-10 text-right text-sm font-semibold text-doux">
                      {totalMois ? Math.round((r.total / totalMois) * 100) : 0}%
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className={cx("h-full rounded-full", r.id === "CREDIT" ? "bg-accent/45" : "bg-accent")} style={{ width: `${(r.total / maxMode) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-12 [&>*]:min-w-0">
        {/* Rappels */}
        <section>
          <TitreSection action={<Link href="/credits" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-accent">Tous les crédits <ArrowRight className="h-4 w-4" strokeWidth={1.75} /></Link>}>
            Rappels du jour
          </TitreSection>
          {rappels.length === 0 ? (
            <div className="flex items-center gap-3 rounded-md bg-surface px-5 py-6 text-doux">
              <CheckCircle2 className="h-5 w-5 text-accent" strokeWidth={1.6} />
              Aucun client à relancer aujourd&apos;hui.
            </div>
          ) : (
            <ul className="divide-y divide-trait border-y border-trait">
              {rappels.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/credits/${r.id}`} className="group min-w-0">
                      <p className="flex items-center gap-2 font-bold group-hover:text-accent">
                        {r.statut === "EN_RETARD" && <BellRing className="h-4 w-4 shrink-0 text-erreur" strokeWidth={1.75} />}
                        <span className="truncate">{nomClient(r.client)}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-doux">
                        {r.statut === "EN_RETARD" ? (
                          <span className="font-semibold text-erreur">En retard depuis le {dateFr(r.dateRappel)}</span>
                        ) : (
                          "Rappel prévu aujourd'hui"
                        )}
                      </p>
                    </Link>
                    <div className="shrink-0 text-right">
                      <p className="chiffres text-lg font-extrabold">{fcfa(r.reste)}</p>
                      {r.statut === "EN_RETARD" ? <Badge ton="erreur">En retard</Badge> : <Badge ton="vert">Aujourd&apos;hui</Badge>}
                    </div>
                  </div>
                  <div className="mt-3">
                    <BoutonRelancer nom={nomClient(r.client)} telephone={r.client.telephone} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Stock faible */}
        <section>
          <TitreSection action={<Link href="/stock?etat=faible" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-accent">Voir le stock <ArrowRight className="h-4 w-4" strokeWidth={1.75} /></Link>}>
            Stock faible et ruptures
          </TitreSection>
          {alertesStock.length === 0 ? (
            <div className="flex items-center gap-3 rounded-md bg-surface px-5 py-6 text-doux">
              <CheckCircle2 className="h-5 w-5 text-accent" strokeWidth={1.6} />
              Tout le stock est suffisant.
            </div>
          ) : (
            <ul className="divide-y divide-trait border-y border-trait">
              {alertesStock.map((a) => (
                <li key={a.id}>
                  <Link href={`/stock/${a.id}`} className="group flex items-center gap-4 py-3">
                    <Vignette photo={a.photo} className="h-12 w-12 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold group-hover:text-accent">{a.marque} {a.modele}</p>
                      <p className="truncate text-sm text-doux">{a.couleur} · P. {a.pointure}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={cx("chiffres text-lg font-extrabold", a.quantite <= 0 ? "text-erreur" : "text-alerte")}>{a.quantite}</span>
                      <BadgeStock quantite={a.quantite} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {alertesStock.length === 0 ? null : (
            <p className="mt-3 flex items-center gap-2 text-sm text-doux">
              <PackageX className="h-4 w-4" strokeWidth={1.6} /> Pensez à commander avant la rupture.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
