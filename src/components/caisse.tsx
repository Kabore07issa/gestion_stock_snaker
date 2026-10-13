"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote, Check, HandCoins, Loader2, Minus, Plus, Search, Smartphone, Trash2, UserPlus, Waves, X,
} from "lucide-react";
import { correspond } from "@/lib/recherche";
import { fcfa, nombre } from "@/lib/format";
import { ajouterJours } from "@/lib/dates";
import { enregistrerVente, type NouvelleVente } from "@/lib/actions/ventes";
import { creerClientRapide } from "@/lib/actions/clients";
import { MarqueSneaker } from "./logo";
import { ChampMontant } from "./champ-montant";
import { Bouton, Message, classesChamp, cx } from "./ui";

export type ArticleCaisse = {
  id: number; marque: string; modele: string; couleur: string; pointure: string;
  prixVente: number; quantite: number; photo: string | null;
};
export type ClientCaisse = { id: number; nom: string; prenom: string; telephone: string };
type Mode = NouvelleVente["mode"];

const MODES: { id: Mode; label: string; Icone: typeof Banknote }[] = [
  { id: "ESPECES", label: "Espèces", Icone: Banknote },
  { id: "WAVE", label: "Wave", Icone: Waves },
  { id: "MOBILE_MONEY", label: "Mobile Money", Icone: Smartphone },
  { id: "CREDIT", label: "Crédit", Icone: HandCoins },
];

function Etape({ n, titre, children, id }: { n: number; titre: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold tracking-tight">
        <span className="chiffres flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-texte">{n}</span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

export function Caisse({
  articles, clients: clientsInitiaux, operateurs, aujourdhui,
}: {
  articles: ArticleCaisse[]; clients: ClientCaisse[]; operateurs: readonly string[]; aujourdhui: string;
}) {
  const router = useRouter();
  const [envoi, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const [recherche, setRecherche] = useState("");
  const [panier, setPanier] = useState<Map<number, number>>(new Map());
  const [remise, setRemise] = useState(0);

  const [clients, setClients] = useState(clientsInitiaux);
  const [clientId, setClientId] = useState<number | null>(null);
  const [rechercheClient, setRechercheClient] = useState("");
  const [nouveauClient, setNouveauClient] = useState(false);
  const [erreurClient, setErreurClient] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("ESPECES");
  const [montantRecu, setMontantRecu] = useState(0);
  const [operateur, setOperateur] = useState<string>(operateurs[0]);
  const [reference, setReference] = useState("");
  const [avance, setAvance] = useState(0);
  const [avanceMode, setAvanceMode] = useState<"ESPECES" | "WAVE" | "MOBILE_MONEY">("ESPECES");
  const [dateRappel, setDateRappel] = useState(ajouterJours(aujourdhui, 7));

  const parId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  const resultats = useMemo(() => {
    const r = articles.filter((a) => correspond(recherche, a.marque, a.modele, a.couleur, a.pointure));
    r.sort((a, b) => Number(b.quantite > 0) - Number(a.quantite > 0));
    return recherche ? r.slice(0, 40) : r.filter((a) => a.quantite > 0).slice(0, 12);
  }, [articles, recherche]);

  const lignes = [...panier.entries()].map(([id, q]) => ({ a: parId.get(id)!, q }));
  const sousTotal = lignes.reduce((s, l) => s + l.a.prixVente * l.q, 0);
  const remiseOk = Math.min(remise, sousTotal);
  const total = sousTotal - remiseOk;
  const nbPaires = lignes.reduce((s, l) => s + l.q, 0);
  const client = clients.find((c) => c.id === clientId) ?? null;
  const monnaie = montantRecu - total;

  const changerQte = (id: number, delta: number) =>
    setPanier((p) => {
      const n = new Map(p);
      const max = parId.get(id)?.quantite ?? 0;
      const q = Math.min(max, (n.get(id) ?? 0) + delta);
      if (q <= 0) n.delete(id);
      else n.set(id, q);
      return n;
    });

  const clientsFiltres = rechercheClient
    ? clients.filter((c) => correspond(rechercheClient, c.nom, c.prenom, c.telephone)).slice(0, 6)
    : [];

  function valider() {
    setErreur(null);
    if (!lignes.length) return setErreur("Ajoutez au moins un article.");
    if (mode === "CREDIT" && !clientId) return setErreur("Choisissez le client pour une vente à crédit.");
    demarrer(async () => {
      const r = await enregistrerVente({
        lignes: lignes.map((l) => ({ articleId: l.a.id, quantite: l.q })),
        clientId,
        remise: remiseOk,
        mode,
        operateur: mode === "MOBILE_MONEY" || (mode === "CREDIT" && avanceMode === "MOBILE_MONEY") ? operateur : undefined,
        reference,
        montantRecu: mode === "ESPECES" ? montantRecu || total : undefined,
        avance: mode === "CREDIT" ? avance : undefined,
        avanceMode: mode === "CREDIT" ? avanceMode : undefined,
        dateRappel: mode === "CREDIT" ? dateRappel : undefined,
      });
      if (r.erreur) setErreur(r.erreur);
      else router.push(`/ventes/${r.id}?nouvelle=1`);
    });
  }

  async function ajouterClient(f: FormData) {
    setErreurClient(null);
    const r = await creerClientRapide(f);
    if (r.erreur) return setErreurClient(r.erreur);
    if (r.client) {
      setClients((c) => [...c, r.client!]);
      setClientId(r.client.id);
      setNouveauClient(false);
      setRechercheClient("");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 [&>*]:min-w-0">
      {/* ---------- 1. Articles ---------- */}
      <Etape n={1} titre="Articles">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-doux" strokeWidth={1.6} />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Modèle, marque, couleur ou pointure…"
            className={cx(classesChamp, "min-h-12 pl-10 text-base")}
            autoComplete="off"
          />
        </label>
        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-doux">
          {recherche ? `${resultats.length} résultat${resultats.length > 1 ? "s" : ""}` : "Articles disponibles"}
        </p>
        <ul className="divide-y divide-trait border-y border-trait">
          {resultats.map((a) => {
            const dansPanier = panier.get(a.id) ?? 0;
            const epuise = a.quantite - dansPanier <= 0;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={epuise}
                  onClick={() => changerQte(a.id, 1)}
                  className="group flex w-full items-center gap-3.5 py-3 text-left transition-colors duration-150 disabled:cursor-not-allowed"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface">
                    {a.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <MarqueSneaker className="w-9 text-accent/40" epaisseur={1.4} />
                    )}
                  </span>
                  <span className={cx("min-w-0 flex-1", a.quantite <= 0 && "opacity-50")}>
                    <span className="block truncate font-bold group-enabled:group-hover:text-accent">
                      {a.marque} {a.modele}
                    </span>
                    <span className="chiffres block font-bold sm:hidden">{fcfa(a.prixVente)}</span>
                    <span className="block truncate text-sm text-doux">
                      {a.couleur} · P. {a.pointure} ·{" "}
                      <span className={cx(a.quantite <= 0 ? "text-erreur" : a.quantite <= 1 && "text-alerte")}>
                        {a.quantite <= 0 ? "rupture" : `${a.quantite} en stock`}
                      </span>
                    </span>
                  </span>
                  <span className="chiffres hidden shrink-0 text-right font-bold sm:block">{fcfa(a.prixVente)}</span>
                  <span
                    className={cx(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors duration-150",
                      dansPanier ? "bg-accent text-accent-texte" : "bg-surface text-accent group-enabled:group-hover:bg-accent group-enabled:group-hover:text-accent-texte",
                      epuise && !dansPanier && "opacity-40",
                    )}
                  >
                    {dansPanier ? <span className="chiffres text-sm font-bold">{dansPanier}</span> : <Plus className="h-5 w-5" strokeWidth={1.75} />}
                  </span>
                </button>
              </li>
            );
          })}
          {resultats.length === 0 && <li className="py-8 text-center text-sm text-doux">Aucun article trouvé.</li>}
        </ul>
      </Etape>

      {/* ---------- Panier, client et paiement ---------- */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="space-y-10">
          <div className="rounded-md bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-doux">Panier</p>
              {lignes.length > 0 && (
                <button type="button" onClick={() => setPanier(new Map())} className="min-h-9 text-sm font-semibold text-doux hover:text-erreur">
                  Vider
                </button>
              )}
            </div>
            {lignes.length === 0 ? (
              <p className="py-6 text-center text-sm text-doux">Touchez un article pour l&apos;ajouter.</p>
            ) : (
              <ul className="divide-y divide-trait">
                {lignes.map(({ a, q }) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{a.marque} {a.modele}</p>
                      <p className="chiffres truncate text-sm text-doux">
                        P. {a.pointure} · {fcfa(a.prixVente)}
                      </p>
                    </div>
                    <div className="flex items-center rounded-md bg-fond ring-1 ring-trait">
                      <button type="button" aria-label="Retirer une paire" onClick={() => changerQte(a.id, -1)} className="flex h-10 w-10 items-center justify-center text-doux hover:text-encre">
                        {q === 1 ? <Trash2 className="h-4 w-4" strokeWidth={1.6} /> : <Minus className="h-4 w-4" strokeWidth={1.75} />}
                      </button>
                      <span className="chiffres w-6 text-center font-bold">{q}</span>
                      <button type="button" aria-label="Ajouter une paire" disabled={q >= a.quantite} onClick={() => changerQte(a.id, 1)} className="flex h-10 w-10 items-center justify-center text-doux hover:text-encre disabled:opacity-30">
                        <Plus className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 border-t border-trait pt-4">
              <ChampMontant label="Remise" valeur={remise} onValeur={setRemise} />
              <dl className="chiffres mt-5 space-y-1.5 text-[15px]">
                <div className="flex justify-between text-doux">
                  <dt>Sous-total ({nbPaires} paire{nbPaires > 1 ? "s" : ""})</dt>
                  <dd>{fcfa(sousTotal)}</dd>
                </div>
                {remiseOk > 0 && (
                  <div className="flex justify-between text-doux">
                    <dt>Remise</dt>
                    <dd>−{fcfa(remiseOk)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="font-bold">Total</dt>
                  <dd className="text-3xl font-extrabold tracking-tight text-accent">{fcfa(total)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* ---------- 2. Client ---------- */}
          <Etape n={2} titre={mode === "CREDIT" ? "Client (obligatoire)" : "Client (facultatif)"}>
            {client ? (
              <div className="flex items-center justify-between gap-3 rounded-md px-4 py-3 ring-1 ring-accent/40">
                <div className="min-w-0">
                  <p className="truncate font-bold">{client.prenom} {client.nom}</p>
                  <p className="chiffres text-sm text-doux">{client.telephone}</p>
                </div>
                <button type="button" aria-label="Changer de client" onClick={() => setClientId(null)} className="flex h-10 w-10 items-center justify-center rounded-md text-doux hover:bg-surface hover:text-encre">
                  <X className="h-5 w-5" strokeWidth={1.6} />
                </button>
              </div>
            ) : nouveauClient ? (
              <form action={ajouterClient} className="space-y-3 rounded-md p-4 ring-1 ring-trait">
                <div className="grid grid-cols-2 gap-3">
                  <input name="prenom" placeholder="Prénom" required className={classesChamp} />
                  <input name="nom" placeholder="Nom" required className={classesChamp} />
                </div>
                <input name="telephone" type="tel" inputMode="tel" placeholder="Téléphone" required className={classesChamp} />
                <input name="pointure" inputMode="decimal" placeholder="Pointure (facultatif)" className={classesChamp} />
                {erreurClient && <Message>{erreurClient}</Message>}
                <div className="flex gap-2">
                  <Bouton type="submit" plein>Enregistrer le client</Bouton>
                  <Bouton type="button" variante="fantome" onClick={() => setNouveauClient(false)}>Annuler</Bouton>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex gap-2">
                  <label className="relative block flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-doux" strokeWidth={1.6} />
                    <input value={rechercheClient} onChange={(e) => setRechercheClient(e.target.value)} type="search" placeholder="Nom ou téléphone" className={cx(classesChamp, "pl-10")} autoComplete="off" />
                  </label>
                  <Bouton type="button" variante="secondaire" onClick={() => setNouveauClient(true)} aria-label="Nouveau client">
                    <UserPlus className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </Bouton>
                </div>
                {clientsFiltres.length > 0 && (
                  <ul className="mt-2 divide-y divide-trait rounded-md ring-1 ring-trait">
                    {clientsFiltres.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => { setClientId(c.id); setRechercheClient(""); }} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-surface">
                          <span className="font-semibold">{c.prenom} {c.nom}</span>
                          <span className="chiffres text-sm text-doux">{c.telephone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {rechercheClient && clientsFiltres.length === 0 && (
                  <p className="mt-2 text-sm text-doux">Aucun client trouvé.</p>
                )}
              </div>
            )}
          </Etape>

          {/* ---------- 3. Paiement ---------- */}
          <Etape n={3} titre="Paiement" id="paiement">
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(({ id, label, Icone }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  aria-pressed={mode === id}
                  className={cx(
                    "flex min-h-14 items-center gap-2.5 rounded-md px-3.5 text-left text-[15px] font-semibold ring-1 ring-inset transition-colors duration-150",
                    mode === id ? "bg-accent/[0.07] text-accent ring-2 ring-accent" : "ring-trait hover:bg-surface",
                  )}
                >
                  <Icone className="h-5 w-5 shrink-0" strokeWidth={1.6} />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {mode === "ESPECES" && (
                <>
                  <ChampMontant label="Montant reçu" valeur={montantRecu} onValeur={setMontantRecu} placeholder={nombre(total)} />
                  <div className="flex gap-2 overflow-x-auto">
                    {[...new Set([total, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000])].filter((m) => m > 0).map((m) => (
                      <button key={m} type="button" onClick={() => setMontantRecu(m)} className="chiffres min-h-10 shrink-0 rounded-md px-3 text-sm font-semibold ring-1 ring-trait hover:bg-surface">
                        {nombre(m)}
                      </button>
                    ))}
                  </div>
                  {montantRecu > 0 && (
                    <div className={cx("flex items-baseline justify-between rounded-md px-4 py-3", monnaie >= 0 ? "bg-accent/[0.07]" : "bg-erreur/10")}>
                      <span className="font-semibold">{monnaie >= 0 ? "Monnaie à rendre" : "Il manque"}</span>
                      <span className={cx("chiffres text-2xl font-extrabold", monnaie >= 0 ? "text-accent" : "text-erreur")}>{fcfa(Math.abs(monnaie))}</span>
                    </div>
                  )}
                </>
              )}

              {(mode === "WAVE" || mode === "MOBILE_MONEY") && (
                <>
                  {mode === "MOBILE_MONEY" && (
                    <div className="grid grid-cols-3 gap-2">
                      {operateurs.map((o) => (
                        <button key={o} type="button" onClick={() => setOperateur(o)} aria-pressed={operateur === o} className={cx("min-h-11 rounded-md px-2 text-sm font-semibold ring-1 ring-inset transition-colors duration-150", operateur === o ? "text-accent ring-2 ring-accent" : "ring-trait hover:bg-surface")}>
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-baseline justify-between rounded-md bg-surface px-4 py-3">
                    <span className="text-sm font-semibold text-doux">Montant à recevoir</span>
                    <span className="chiffres text-xl font-extrabold">{fcfa(total)}</span>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold">Numéro de transaction</span>
                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex. : T240513.1234.A56789" className={cx(classesChamp, "font-mono uppercase")} autoComplete="off" />
                  </label>
                </>
              )}

              {mode === "CREDIT" && (
                <>
                  <ChampMontant label="Avance versée (facultatif)" valeur={avance} onValeur={setAvance} />
                  {avance > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {(["ESPECES", "WAVE", "MOBILE_MONEY"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setAvanceMode(m)} aria-pressed={avanceMode === m} className={cx("min-h-11 rounded-md px-2 text-sm font-semibold ring-1 ring-inset", avanceMode === m ? "text-accent ring-2 ring-accent" : "ring-trait hover:bg-surface")}>
                          {m === "ESPECES" ? "Espèces" : m === "WAVE" ? "Wave" : "Mobile Money"}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-baseline justify-between rounded-md bg-alerte/10 px-4 py-3">
                    <span className="font-semibold">Reste à payer</span>
                    <span className="chiffres text-2xl font-extrabold text-alerte">{fcfa(Math.max(0, total - avance))}</span>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold">Date de rappel (obligatoire)</span>
                    <input type="date" value={dateRappel} min={aujourdhui} onChange={(e) => setDateRappel(e.target.value)} required className={classesChamp} />
                  </label>
                  <div className="flex gap-2">
                    {[7, 15, 30].map((j) => (
                      <button key={j} type="button" onClick={() => setDateRappel(ajouterJours(aujourdhui, j))} className={cx("min-h-10 rounded-md px-3 text-sm font-semibold ring-1 ring-inset", dateRappel === ajouterJours(aujourdhui, j) ? "text-accent ring-accent" : "ring-trait hover:bg-surface")}>
                        {j} jours
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {erreur && <div className="mt-5"><Message>{erreur}</Message></div>}

            <Bouton type="button" taille="lg" plein className="mt-6" disabled={envoi || !lignes.length} onClick={valider}>
              {envoi ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} /> : <Check className="h-5 w-5" strokeWidth={2} />}
              Valider la vente · <span className="chiffres">{fcfa(total)}</span>
            </Bouton>
          </Etape>
        </div>
      </div>

      {/* Rappel du total — mobile */}
      {lignes.length > 0 && (
        <a href="#paiement" className="fixed inset-x-3 bottom-[76px] z-20 flex items-center justify-between rounded-md bg-encre px-4 py-3 text-fond shadow-lg lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <span className="text-sm font-semibold">{nbPaires} paire{nbPaires > 1 ? "s" : ""}</span>
          <span className="chiffres font-extrabold">{fcfa(total)} →</span>
        </a>
      )}
    </div>
  );
}
