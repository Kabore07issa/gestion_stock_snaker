"use client";

import { useState } from "react";
import { fcfa, nombre } from "@/lib/format";
import { cx } from "./ui";

type Point = { jour: string; libelle: string; total: number; nb: number };

/** Barres des ventes quotidiennes (30 jours) avec info-bulle au survol / toucher. */
export function GraphiqueVentes({ donnees }: { donnees: Point[] }) {
  const [actif, setActif] = useState<number | null>(null);
  const max = Math.max(...donnees.map((d) => d.total), 1);
  // Graduation « ronde » pour l'axe
  const pas = 10 ** Math.floor(Math.log10(max));
  const haut = Math.ceil(max / pas) * pas;
  const p = actif != null ? donnees[actif] : null;

  return (
    <figure>
      <div className="relative h-44 sm:h-52" onMouseLeave={() => setActif(null)}>
        {/* Lignes de repère discrètes */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[haut, haut / 2, 0].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="chiffres w-10 shrink-0 text-right text-[11px] text-doux">{v >= 1000 ? `${nombre(v / 1000)}k` : nombre(v)}</span>
              <span className={cx("h-px flex-1", v === 0 ? "bg-trait" : "bg-trait/60")} />
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 left-12 right-0 flex items-end gap-[2px]">
          {donnees.map((d, i) => (
            <button
              key={d.jour}
              type="button"
              aria-label={`${d.libelle} : ${fcfa(d.total)}`}
              onMouseEnter={() => setActif(i)}
              onFocus={() => setActif(i)}
              onClick={() => setActif(i)}
              className="group relative flex h-full flex-1 items-end justify-center outline-none"
            >
              <span
                className={cx(
                  "block w-full max-w-[18px] rounded-t-[4px] transition-colors duration-150",
                  d.total === 0 ? "bg-trait" : actif === i ? "bg-accent-hover" : "bg-accent",
                  actif != null && actif !== i && d.total > 0 && "opacity-50",
                )}
                style={{ height: d.total ? `${Math.max(2, (d.total / haut) * 100)}%` : "2px" }}
              />
            </button>
          ))}
        </div>

        {p && actif != null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md bg-encre px-3 py-2 text-fond shadow-lg"
            style={{
              left: `calc(3rem + (100% - 3rem) * ${(actif + 0.5) / donnees.length})`,
              transform: `translate(${actif < 4 ? "-15%" : actif > donnees.length - 5 ? "-85%" : "-50%"}, -100%)`,
            }}
          >
            <p className="text-[11px] opacity-70">{p.libelle}</p>
            <p className="chiffres text-sm font-bold">{fcfa(p.total)}</p>
            <p className="text-[11px] opacity-70">{p.nb} vente{p.nb > 1 ? "s" : ""}</p>
          </div>
        )}
      </div>
      <div className="chiffres ml-12 mt-2 flex justify-between text-[11px] text-doux">
        <span>{donnees[0]?.libelle}</span>
        <span>{donnees[Math.floor(donnees.length / 2)]?.libelle}</span>
        <span>Aujourd&apos;hui</span>
      </div>
      <table className="sr-only">
        <caption>Ventes des 30 derniers jours</caption>
        <tbody>
          {donnees.map((d) => (
            <tr key={d.jour}>
              <td>{d.libelle}</td>
              <td>{fcfa(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
