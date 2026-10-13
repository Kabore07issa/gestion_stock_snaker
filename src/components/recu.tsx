import type { Client, LigneVente, Vente, Credit, Versement } from "@prisma/client";
import { BOUTIQUE } from "@/config";
import { dateFr, fcfa, heure, libelleMode, nomClient } from "@/lib/format";
import { MarqueSneaker } from "./logo";

type V = Vente & { lignes: LigneVente[]; client: Client | null; credit: (Credit & { versements: Versement[] }) | null };

function Ligne({ g, d, fort }: { g: React.ReactNode; d: React.ReactNode; fort?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${fort ? "text-[15px] font-extrabold" : ""}`}>
      <span>{g}</span>
      <span className="chiffres whitespace-nowrap">{d}</span>
    </div>
  );
}

/** Reçu au format ticket 80 mm (imprimé via window.print). */
export function Recu({ v }: { v: V }) {
  const avance = v.credit?.versements.filter((x) => x.estAvance).reduce((s, x) => s + x.montant, 0) ?? 0;
  return (
    <div
      id="recu"
      className="mx-auto w-full max-w-[340px] rounded-md bg-white px-6 py-7 font-sans text-[12.5px] leading-relaxed text-[#0E2A1E] ring-1 ring-[#DCEDE3]"
    >
      <div className="flex flex-col items-center text-center">
        <MarqueSneaker className="h-8 w-16 text-[#0A7A4F]" epaisseur={1.8} />
        <p className="mt-1.5 text-lg font-extrabold tracking-tight">{BOUTIQUE.nom}</p>
        <p className="text-[11px] text-[#5C7268]">{BOUTIQUE.adresse}</p>
        <p className="text-[11px] text-[#5C7268]">{BOUTIQUE.telephone}</p>
      </div>

      <div className="my-4 border-t border-dashed border-[#9db5a9]" />
      <Ligne g={`Reçu n° ${String(v.id).padStart(5, "0")}`} d={`${dateFr(v.date)} ${heure(v.date)}`} />
      {v.client && <Ligne g="Client" d={nomClient(v.client)} />}
      {v.annulee && <p className="mt-1 text-center font-extrabold uppercase">*** Vente annulée ***</p>}
      <div className="my-4 border-t border-dashed border-[#9db5a9]" />

      <div className="space-y-2">
        {v.lignes.map((l) => (
          <div key={l.id}>
            <p className="font-semibold">{l.libelle}</p>
            <Ligne g={<span className="text-[#5C7268]">{l.quantite} × {fcfa(l.prixUnitaire)}</span>} d={fcfa(l.quantite * l.prixUnitaire)} />
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-dashed border-[#9db5a9]" />
      {v.remise > 0 && (
        <>
          <Ligne g="Sous-total" d={fcfa(v.sousTotal)} />
          <Ligne g="Remise" d={`−${fcfa(v.remise)}`} />
        </>
      )}
      <Ligne g="TOTAL" d={fcfa(v.total)} fort />
      <div className="mt-2 space-y-0.5">
        <Ligne g="Paiement" d={libelleMode(v.modePaiement, v.operateur)} />
        {v.reference && <Ligne g="Transaction" d={v.reference} />}
        {v.modePaiement === "ESPECES" && v.montantRecu != null && (
          <>
            <Ligne g="Reçu" d={fcfa(v.montantRecu)} />
            <Ligne g="Monnaie rendue" d={fcfa(v.monnaie ?? 0)} />
          </>
        )}
        {v.credit && (
          <>
            <Ligne g="Avance" d={fcfa(avance)} />
            <Ligne g="Reste à payer" d={fcfa(v.credit.montantTotal - avance)} fort />
            <Ligne g="À régler avant le" d={dateFr(v.credit.dateRappel)} />
          </>
        )}
      </div>

      <div className="my-4 border-t border-dashed border-[#9db5a9]" />
      <p className="text-center text-[11px] text-[#5C7268]">{BOUTIQUE.messageRecu}</p>
      <p className="mt-2 text-center text-[11px] font-semibold">Merci et à bientôt !</p>
    </div>
  );
}
