import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Download, Plus, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateFr, fcfa, heure, libelleMode, nomClient } from "@/lib/format";
import { ajouterJours, debutJour, estDateIso } from "@/lib/dates";
import { Badge, EnTete, LienBouton, Vide, classesChamp, cx } from "@/components/ui";
import { FiltresAuto } from "@/components/filtres-auto";

export const metadata: Metadata = { title: "Ventes" };

type SP = Promise<{ du?: string; au?: string; mode?: string; annulees?: string }>;

export default async function PageVentes({ searchParams }: { searchParams: SP }) {
  const { du = "", au = "", mode = "", annulees = "" } = await searchParams;

  const where: Prisma.VenteWhereInput = {};
  const date: Prisma.DateTimeFilter = {};
  if (estDateIso(du)) date.gte = debutJour(du);
  if (estDateIso(au)) date.lt = debutJour(ajouterJours(au, 1));
  if (date.gte || date.lt) where.date = date;
  if (mode) where.modePaiement = mode;
  if (!annulees) where.annulee = false;

  const ventes = await prisma.vente.findMany({
    where,
    include: { client: true, lignes: { select: { libelle: true, quantite: true } } },
    orderBy: { date: "desc" },
    take: 300,
  });
  const valides = ventes.filter((v) => !v.annulee);
  const total = valides.reduce((s, v) => s + v.total, 0);
  const paires = valides.reduce((s, v) => s + v.lignes.reduce((t, l) => t + l.quantite, 0), 0);

  const qs = new URLSearchParams(Object.entries({ du, au, mode }).filter(([, v]) => v)).toString();

  // Regroupement par jour
  const jours = new Map<string, typeof ventes>();
  for (const v of ventes) {
    const j = dateFr(v.date);
    jours.set(j, [...(jours.get(j) ?? []), v]);
  }

  return (
    <>
      <EnTete
        titre="Ventes"
        sousTitre={
          <span className="chiffres">
            {valides.length} vente{valides.length > 1 ? "s" : ""} · {paires} paire{paires > 1 ? "s" : ""} · {fcfa(total)}
          </span>
        }
        actions={
          <>
            <LienBouton href={`/api/export/ventes${qs ? `?${qs}` : ""}`} variante="secondaire" prefetch={false}>
              <Download className="h-4 w-4" strokeWidth={1.75} /> Excel
            </LienBouton>
            <LienBouton href="/ventes/nouvelle">
              <Plus className="h-[18px] w-[18px]" strokeWidth={2} /> Nouvelle vente
            </LienBouton>
          </>
        }
      />

      <FiltresAuto className="mb-10 grid grid-cols-2 gap-2.5 sm:grid-cols-[170px_170px_200px_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-doux">Du</span>
          <input type="date" name="du" defaultValue={du} className={classesChamp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-doux">Au</span>
          <input type="date" name="au" defaultValue={au} className={classesChamp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-doux">Paiement</span>
          <select name="mode" defaultValue={mode} className={classesChamp}>
            <option value="">Tous les modes</option>
            <option value="ESPECES">Espèces</option>
            <option value="WAVE">Wave</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CREDIT">Crédit</option>
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 self-end text-sm font-semibold text-doux">
          <input type="checkbox" name="annulees" value="1" defaultChecked={!!annulees} className="h-[18px] w-[18px] accent-[rgb(var(--accent))]" />
          Afficher les annulées
        </label>
      </FiltresAuto>

      {ventes.length === 0 ? (
        <Vide
          icone={<ShoppingBag className="h-8 w-8" strokeWidth={1.4} />}
          titre="Aucune vente sur cette période"
          action={<LienBouton href="/ventes/nouvelle">Faire une vente</LienBouton>}
        />
      ) : (
        <div className="space-y-10">
          {[...jours.entries()].map(([jour, liste]) => (
            <section key={jour}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-doux">{jour}</h2>
                <p className="chiffres text-sm font-semibold text-doux">
                  {fcfa(liste.filter((v) => !v.annulee).reduce((s, v) => s + v.total, 0))}
                </p>
              </div>
              <ul className="divide-y divide-trait border-y border-trait">
                {liste.map((v) => (
                  <li key={v.id}>
                    <Link href={`/ventes/${v.id}`} className={cx("group flex items-center gap-4 py-3.5", v.annulee && "opacity-55")}>
                      <span className="chiffres w-12 shrink-0 text-sm text-doux">{heure(v.date)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold group-hover:text-accent">
                          {v.lignes.map((l) => (l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle)).join(", ")}
                        </p>
                        <p className="truncate text-sm text-doux">
                          n° {v.id} · {v.client ? nomClient(v.client) : "Client de passage"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cx("chiffres font-bold", v.annulee && "line-through")}>{fcfa(v.total)}</p>
                        <div className="mt-0.5">
                          {v.annulee ? (
                            <Badge ton="erreur">Annulée</Badge>
                          ) : (
                            <Badge ton={v.modePaiement === "CREDIT" ? "alerte" : "neutre"}>{libelleMode(v.modePaiement, v.operateur)}</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
