"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Bouton } from "./ui";

export function BoutonImprimer({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [auto]);
  return (
    <Bouton type="button" onClick={() => window.print()}>
      <Printer className="h-[18px] w-[18px]" strokeWidth={1.75} /> Imprimer le reçu
    </Bouton>
  );
}
