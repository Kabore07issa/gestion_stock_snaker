"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useTransition, type ReactNode } from "react";
import { cx } from "./ui";

/**
 * Formulaire de filtres GET qui se met à jour automatiquement
 * (sélecteurs immédiatement, recherche après une courte pause).
 */
export function FiltresAuto({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLFormElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [enCours, demarrer] = useTransition();

  const appliquer = () => {
    if (!ref.current) return;
    const p = new URLSearchParams();
    new FormData(ref.current).forEach((v, k) => {
      if (typeof v === "string" && v.trim()) p.set(k, v.trim());
    });
    const qs = p.toString();
    demarrer(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <form
      ref={ref}
      role="search"
      className={cx(className, "transition-opacity duration-200", enCours && "opacity-70")}
      onSubmit={(e) => {
        e.preventDefault();
        appliquer();
      }}
      onChange={(e) => {
        clearTimeout(minuterie.current);
        const t = e.target as HTMLInputElement;
        if (t.type === "search" || t.type === "text") minuterie.current = setTimeout(appliquer, 300);
        else appliquer();
      }}
    >
      {children}
    </form>
  );
}
