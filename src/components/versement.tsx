"use client";

import { useState } from "react";
import { Phone, PhoneCall, X } from "lucide-react";
import { enregistrerVersement } from "@/lib/actions/credits";
import { fcfa } from "@/lib/format";
import { BoutonEnvoi, Formulaire } from "./formulaire";
import { ChampMontant } from "./champ-montant";
import { Bouton, classesChamp, cx } from "./ui";

const MODES = [
  { id: "ESPECES", label: "Espèces" },
  { id: "WAVE", label: "Wave" },
  { id: "MOBILE_MONEY", label: "Mobile Money" },
];

export function FormulaireVersement({ creditId, reste, operateurs }: { creditId: number; reste: number; operateurs: readonly string[] }) {
  const [mode, setMode] = useState("ESPECES");
  const [montant, setMontant] = useState(0);
  const [cle, setCle] = useState(0);

  return (
    <Formulaire key={cle} action={enregistrerVersement} apresSucces={() => { setMontant(0); setCle((k) => k + 1); }} className="space-y-4">
      <input type="hidden" name="creditId" value={creditId} />
      <ChampMontant label="Montant versé" name="montant" valeur={montant} onValeur={setMontant} required />
      <div className="flex gap-2">
        <button type="button" onClick={() => setMontant(reste)} className="chiffres min-h-10 rounded-md px-3 text-sm font-semibold ring-1 ring-inset ring-trait hover:bg-fond">
          Tout ({fcfa(reste)})
        </button>
        {reste >= 2000 && (
          <button type="button" onClick={() => setMontant(Math.round(reste / 2 / 500) * 500)} className="min-h-10 rounded-md px-3 text-sm font-semibold ring-1 ring-inset ring-trait hover:bg-fond">
            La moitié
          </button>
        )}
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold">Mode de paiement</legend>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <label key={m.id} className={cx("flex min-h-11 cursor-pointer items-center justify-center rounded-md px-2 text-center text-sm font-semibold ring-1 ring-inset transition-colors duration-150", mode === m.id ? "bg-fond text-accent ring-2 ring-accent" : "ring-trait hover:bg-fond")}>
              <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="sr-only" />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      {mode === "MOBILE_MONEY" && (
        <select name="operateur" className={classesChamp} aria-label="Opérateur" defaultValue={operateurs[0]}>
          {operateurs.map((o) => <option key={o}>{o}</option>)}
        </select>
      )}
      {mode !== "ESPECES" && (
        <input name="reference" placeholder="Numéro de transaction (facultatif)" className={cx(classesChamp, "font-mono uppercase")} autoComplete="off" />
      )}
      <BoutonEnvoi plein taille="lg">Enregistrer le versement</BoutonEnvoi>
    </Formulaire>
  );
}

/** Bouton « Relancer » : affiche le numéro du client avec un lien d'appel. */
export function BoutonRelancer({ nom, telephone, plein }: { nom: string; telephone: string; plein?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  if (!ouvert)
    return (
      <Bouton type="button" onClick={() => setOuvert(true)} plein={plein}>
        <PhoneCall className="h-[18px] w-[18px]" strokeWidth={1.75} /> Relancer
      </Bouton>
    );
  return (
    <div className="flex animate-entree items-center gap-2 rounded-md bg-accent/[0.08] p-1.5 pl-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-doux">{nom}</p>
        <p className="chiffres text-lg font-extrabold tracking-tight">{telephone}</p>
      </div>
      <a href={`tel:${telephone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-texte transition-colors duration-150 hover:bg-accent-hover">
        <Phone className="h-4 w-4" strokeWidth={1.75} /> Appeler
      </a>
      <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" className="flex h-11 w-9 items-center justify-center text-doux hover:text-encre">
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
