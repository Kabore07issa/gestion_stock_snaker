import Link from "next/link";
import type { Metadata } from "next";
import { Download, Plus, Search, PackageOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fcfa } from "@/lib/format";
import { correspond } from "@/lib/recherche";
import { BOUTIQUE } from "@/config";
import { EnTete, LienBouton, Vide, classesChamp, cx } from "@/components/ui";
import { BadgeStock, Vignette } from "@/components/article";
import { FiltresAuto } from "@/components/filtres-auto";

export const metadata: Metadata = { title: "Stock" };

type SP = Promise<{ q?: string; marque?: string; pointure?: string; etat?: string }>;

export default async function PageStock({ searchParams }: { searchParams: SP }) {
  const { q = "", marque = "", pointure = "", etat = "" } = await searchParams;
  const tous = await prisma.article.findMany({ orderBy: [{ marque: "asc" }, { modele: "asc" }, { pointure: "asc" }] });

  const marques = [...new Set(tous.map((a) => a.marque))].sort((a, b) => a.localeCompare(b, "fr"));
  const pointures = [...new Set(tous.map((a) => a.pointure))].sort((a, b) => parseFloat(a) - parseFloat(b));

  const articles = tous.filter(
    (a) =>
      correspond(q, a.modele, a.marque, a.couleur, a.pointure) &&
      (!marque || a.marque === marque) &&
      (!pointure || a.pointure === pointure) &&
      (!etat ||
        (etat === "rupture" && a.quantite <= 0) ||
        (etat === "faible" && a.quantite > 0 && a.quantite <= BOUTIQUE.seuilStockFaible)),
  );

  const paires = tous.reduce((s, a) => s + Math.max(0, a.quantite), 0);
  const valeur = tous.reduce((s, a) => s + Math.max(0, a.quantite) * a.prixAchat, 0);
  const alertes = tous.filter((a) => a.quantite <= BOUTIQUE.seuilStockFaible).length;

  return (
    <>
      <EnTete
        titre="Stock"
        sousTitre={
          <span className="chiffres">
            {paires} paires · {tous.length} références · valeur d&apos;achat {fcfa(valeur)}
          </span>
        }
        actions={
          <>
          <LienBouton href="/api/export/stock" variante="secondaire" prefetch={false}>
            <Download className="h-4 w-4" strokeWidth={1.75} /> Excel
          </LienBouton>
          <LienBouton href="/stock/nouveau">
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} /> Nouvel article
          </LienBouton>
          </>
        }
      />

      <FiltresAuto className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_180px_140px_160px]">
        <label className="relative col-span-2 sm:col-span-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-doux" strokeWidth={1.6} />
          <input name="q" defaultValue={q} placeholder="Rechercher un modèle, une couleur…" className={cx(classesChamp, "pl-10")} type="search" />
        </label>
        <select name="marque" defaultValue={marque} className={classesChamp} aria-label="Marque">
          <option value="">Toutes marques</option>
          {marques.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select name="pointure" defaultValue={pointure} className={classesChamp} aria-label="Pointure">
          <option value="">Pointures</option>
          {pointures.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select name="etat" defaultValue={etat} className={cx(classesChamp, "col-span-2 sm:col-span-1")} aria-label="État du stock">
          <option value="">Tout le stock</option>
          <option value="faible">Stock faible</option>
          <option value="rupture">Rupture</option>
        </select>
      </FiltresAuto>

      {alertes > 0 && !etat && (
        <p className="-mt-4 mb-6 text-sm text-doux">
          <Link href="/stock?etat=faible" className="font-semibold text-alerte underline-offset-4 hover:underline">
            {alertes} article{alertes > 1 ? "s" : ""} à réapprovisionner
          </Link>
        </p>
      )}

      {articles.length === 0 ? (
        <Vide
          icone={<PackageOpen className="h-8 w-8" strokeWidth={1.4} />}
          titre={tous.length ? "Aucun article ne correspond" : "Aucun article en stock"}
          texte={tous.length ? "Modifiez la recherche ou les filtres." : "Ajoutez votre premier article pour commencer."}
          action={!tous.length && <LienBouton href="/stock/nouveau">Ajouter un article</LienBouton>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
          {articles.map((a) => (
            <li key={a.id}>
              <Link href={`/stock/${a.id}`} className="group block">
                <div className="relative">
                  <Vignette photo={a.photo} alt={a.modele} className="aspect-square rounded-md transition-opacity duration-200 group-hover:opacity-90" />
                  <div className="absolute left-2.5 top-2.5">
                    <BadgeStock quantite={a.quantite} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-doux">{a.marque}</p>
                <p className="mt-0.5 truncate font-bold leading-snug group-hover:text-accent">{a.modele}</p>
                <p className="mt-0.5 truncate text-sm text-doux">
                  {a.couleur} · P. {a.pointure}
                </p>
                <div className="chiffres mt-2 flex items-baseline justify-between gap-2">
                  <span className="font-bold">{fcfa(a.prixVente)}</span>
                  <span className={cx("text-sm font-semibold", a.quantite <= 0 ? "text-erreur" : a.quantite <= BOUTIQUE.seuilStockFaible ? "text-alerte" : "text-doux")}>
                    {a.quantite} paire{Math.abs(a.quantite) > 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
