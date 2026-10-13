import { nombre } from "@/lib/format";

/** Grand montant : le chiffre en avant, « FCFA » en retrait. */
export function Montant({ valeur }: { valeur: number }) {
  return (
    <span className="chiffres whitespace-nowrap">
      {nombre(valeur)}
      <span className="ml-1.5 text-[0.42em] font-bold tracking-normal opacity-60">FCFA</span>
    </span>
  );
}
