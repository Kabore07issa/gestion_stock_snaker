"use client";

import { useState } from "react";
import { nombre } from "@/lib/format";
import { classesChamp, cx } from "./ui";

/** Saisie d'un montant en FCFA avec séparateur de milliers automatique. */
export function ChampMontant({
  label,
  name,
  defaut,
  required,
  valeur,
  onValeur,
  placeholder = "0",
  className,
  autoFocus,
}: {
  label: string;
  name?: string;
  defaut?: number;
  required?: boolean;
  valeur?: number;
  onValeur?: (n: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [interne, setInterne] = useState(defaut ?? 0);
  const v = valeur ?? interne;
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <span className="relative block">
        <input
          name={name}
          inputMode="numeric"
          autoComplete="off"
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={v ? nombre(v) : ""}
          onChange={(e) => {
            const n = parseInt(e.target.value.replace(/[^\d]/g, "") || "0", 10);
            const borne = Math.min(n, 999_999_999);
            setInterne(borne);
            onValeur?.(borne);
          }}
          className={cx(classesChamp, "chiffres pr-16 font-semibold")}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-doux">FCFA</span>
      </span>
    </label>
  );
}
