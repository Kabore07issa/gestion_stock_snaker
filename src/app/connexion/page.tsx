import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { Champ } from "@/components/ui";
import { BoutonEnvoi, Formulaire } from "@/components/formulaire";
import { creerCompte, seConnecter } from "@/lib/actions/auth";
import { BOUTIQUE } from "@/config";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function PageConnexion() {
  const premierLancement = (await prisma.utilisateur.count()) === 0;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* Panneau visuel (ordinateur) */}
      <section className="relative hidden overflow-hidden bg-accent lg:flex lg:flex-col lg:justify-between lg:p-14">
        <svg viewBox="2 4 61 31" className="absolute -right-24 bottom-10 w-[115%] text-white/10" fill="none" stroke="currentColor" strokeWidth="0.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7.5 32.5H56.5Q61 32.5 61 28.5Q61 24.6 55.5 23L45 20Q39.5 18.4 35 14.6L28 8.8Q25.6 6.9 23.4 9.1L20.6 12Q17.4 15.3 13 13.6Q8.4 11.9 6.6 16.4Q5 20.5 5 25.5V30Q5 32.5 7.5 32.5Z" />
          <path d="M5.2 27.5H60.6" />
          <path d="M27.6 12.6l-2.2 3M31.4 15.8l-2.2 3M35.4 18.6l-2 3" />
          <path d="M12.5 20.5Q21 23.2 30.6 22.7" />
        </svg>
        <p className="relative text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{BOUTIQUE.ville}</p>
        <div className="relative max-w-md">
          <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
            Chaque paire, <br />chaque client, <br />au bon endroit.
          </h2>
          <p className="mt-5 text-white/75">Ventes, stock, clients et crédits — tout votre commerce, simplement.</p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-sm animate-entree">
          <Logo taille="lg" />
          <h1 className="mt-14 text-3xl font-extrabold tracking-tight">
            {premierLancement ? "Créer votre compte" : "Bon retour"}
          </h1>
          <p className="mt-2 text-doux">
            {premierLancement
              ? "Premier lancement : choisissez l'identifiant et le mot de passe du gérant."
              : "Connectez-vous pour gérer la boutique."}
          </p>

          {premierLancement ? (
            <Formulaire action={creerCompte} className="mt-10 space-y-5">
              <Champ label="Identifiant" name="identifiant" autoComplete="username" autoCapitalize="none" required minLength={3} />
              <Champ label="Mot de passe" name="motDePasse" type="password" autoComplete="new-password" required minLength={8} aide="8 caractères minimum." />
              <Champ label="Confirmer le mot de passe" name="confirmation" type="password" autoComplete="new-password" required />
              <BoutonEnvoi taille="lg" plein>Créer le compte</BoutonEnvoi>
            </Formulaire>
          ) : (
            <Formulaire action={seConnecter} className="mt-10 space-y-5">
              <Champ label="Identifiant" name="identifiant" autoComplete="username" autoCapitalize="none" required autoFocus />
              <Champ label="Mot de passe" name="motDePasse" type="password" autoComplete="current-password" required />
              <BoutonEnvoi taille="lg" plein>Se connecter</BoutonEnvoi>
            </Formulaire>
          )}
        </div>
      </section>
    </main>
  );
}
