import { LienBouton } from "@/components/ui";
import { MarqueSneaker } from "@/components/logo";

export default function Introuvable() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <MarqueSneaker className="w-24 text-accent/40" epaisseur={1.2} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Page introuvable</h1>
      <p className="mt-2 text-doux">Cette page n&apos;existe pas ou a été supprimée.</p>
      <LienBouton href="/" className="mt-8">Retour à l&apos;accueil</LienBouton>
    </main>
  );
}
