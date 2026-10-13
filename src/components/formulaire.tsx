"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Bouton, Message } from "./ui";

export type EtatAction = { erreur?: string; ok?: string; t?: number } | undefined;
export type Action = (etat: EtatAction, donnees: FormData) => Promise<EtatAction>;

// Indique aux boutons d'envoi qu'une action est en cours.
const EnvoiEnCours = createContext(false);

export function Formulaire({
  action,
  children,
  className,
  reinitialiser = false,
  apresSucces,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  reinitialiser?: boolean;
  apresSucces?: () => void;
}) {
  const [etat, envoyer, enCours] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (etat?.ok) {
      if (reinitialiser) ref.current?.reset();
      apresSucces?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat]);

  return (
    // Envoi manuel (au lieu de action=…) pour que React ne vide pas
    // les champs quand le serveur renvoie une erreur.
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => envoyer(donnees));
      }}
    >
      <EnvoiEnCours.Provider value={enCours}>{children}</EnvoiEnCours.Provider>
      {etat?.erreur && (
        <div className="mt-4">
          <Message>{etat.erreur}</Message>
        </div>
      )}
      {etat?.ok && !apresSucces && (
        <div className="mt-4">
          <Message ton="succes">{etat.ok}</Message>
        </div>
      )}
    </form>
  );
}

export function BoutonEnvoi({ children, ...p }: ComponentProps<typeof Bouton>) {
  const { pending: statut } = useFormStatus();
  const enCours = useContext(EnvoiEnCours);
  const pending = statut || enCours;
  return (
    <Bouton type="submit" disabled={pending || p.disabled} {...p}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />}
      {children}
    </Bouton>
  );
}

/** Bouton qui demande une confirmation avant d'exécuter l'action serveur. */
export function BoutonConfirmer({
  action,
  question,
  children,
  ...p
}: { action: () => Promise<unknown>; question: string } & ComponentProps<typeof Bouton>) {
  return (
    <form
      action={async () => {
        await action();
      }}
      onSubmit={(e) => {
        if (!window.confirm(question)) e.preventDefault();
      }}
    >
      <BoutonEnvoi {...p}>{children}</BoutonEnvoi>
    </form>
  );
}
