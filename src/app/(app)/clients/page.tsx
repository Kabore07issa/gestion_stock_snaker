import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fcfa, nomClient } from "@/lib/format";
import { correspond } from "@/lib/recherche";
import { calculCredit } from "@/lib/credit";
import { EnTete, LienBouton, Vide, classesChamp, cx, Badge } from "@/components/ui";
import { FiltresAuto } from "@/components/filtres-auto";
import { Initiales } from "@/components/credit";

export const metadata: Metadata = { title: "Clients" };

export default async function PageClients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const tous = await prisma.client.findMany({
    orderBy: [{ prenom: "asc" }, { nom: "asc" }],
    include: {
      ventes: { where: { annulee: false }, select: { total: true } },
      credits: { where: { vente: { annulee: false } }, include: { versements: { select: { montant: true } } } },
    },
  });

  const clients = tous
    .filter((c) => correspond(q, c.nom, c.prenom, c.telephone))
    .map((c) => ({
      ...c,
      achats: c.ventes.reduce((s, v) => s + v.total, 0),
      reste: c.credits.reduce((s, cr) => s + calculCredit(cr).reste, 0),
    }));

  return (
    <>
      <EnTete
        titre="Clients"
        sousTitre={`${tous.length} client${tous.length > 1 ? "s" : ""}`}
        actions={
          <LienBouton href="/clients/nouveau">
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} /> Nouveau client
          </LienBouton>
        }
      />

      <FiltresAuto className="mb-8 max-w-xl">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-doux" strokeWidth={1.6} />
          <input name="q" type="search" defaultValue={q} placeholder="Nom ou téléphone…" className={cx(classesChamp, "pl-10")} autoComplete="off" />
        </label>
      </FiltresAuto>

      {clients.length === 0 ? (
        <Vide
          icone={<Users className="h-8 w-8" strokeWidth={1.4} />}
          titre={tous.length ? "Aucun client trouvé" : "Aucun client pour l'instant"}
          texte={tous.length ? "Essayez un autre nom ou numéro." : "Ajoutez vos clients fidèles pour suivre leurs achats et crédits."}
          action={!tous.length && <LienBouton href="/clients/nouveau">Ajouter un client</LienBouton>}
        />
      ) : (
        <ul className="divide-y divide-trait border-y border-trait">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="group flex items-center gap-4 py-4 transition-colors duration-150">
                <Initiales prenom={c.prenom} nom={c.nom} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold group-hover:text-accent">{nomClient(c)}</p>
                  <p className="chiffres truncate text-sm text-doux">
                    {c.telephone}
                    {c.pointure ? ` · P. ${c.pointure}` : ""}
                  </p>
                </div>
                <div className="chiffres hidden text-right sm:block">
                  <p className="text-sm text-doux">Achats</p>
                  <p className="font-semibold">{fcfa(c.achats)}</p>
                </div>
                <div className="w-auto text-right sm:w-36">
                  {c.reste > 0 ? <Badge ton="alerte" className="chiffres">Doit {fcfa(c.reste)}</Badge> : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-doux/60 transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
